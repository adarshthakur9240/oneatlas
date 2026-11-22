// scripts/test-db-resilience.ts
// Unit test script verifying:
// 1. isTransientDbError predicate on all transient codes & messages
// 2. isTransientDbError returns false for non-transient / application errors
// 3. withRetry execution, exponential backoff, and retry limits

import { Prisma } from "@prisma/client";
import { isTransientDbError, withRetry } from "../src/lib/prisma";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function runTests() {
  console.log("\n========================================");
  console.log("🧪 Testing Database Resilience & Retries");
  console.log("========================================\n");

  // --- Section 1: Transient Error Detection ---
  console.log("1. Checking transient error codes (should be TRUE):");

  const transientCodes = ["P1001", "P1002", "P1008", "P1017", "P2024"];
  for (const code of transientCodes) {
    const err = new Prisma.PrismaClientKnownRequestError(`Connection error ${code}`, {
      code,
      clientVersion: "6.0.0",
    });
    assert(isTransientDbError(err) === true, `PrismaClientKnownRequestError code ${code} is transient`);
  }

  const initErr = new Prisma.PrismaClientInitializationError("Initialization timeout", "6.0.0");
  assert(isTransientDbError(initErr) === true, "PrismaClientInitializationError is transient");

  const closedErr = new Prisma.PrismaClientUnknownRequestError(
    "Error in PostgreSQL connection: Error { kind: Closed, cause: None }",
    { clientVersion: "6.0.0" }
  );
  assert(isTransientDbError(closedErr) === true, "PrismaClientUnknownRequestError with 'Closed' is transient");

  const termErr = new Prisma.PrismaClientUnknownRequestError(
    "FATAL: terminating connection due to administrator command",
    { clientVersion: "6.0.0" }
  );
  assert(isTransientDbError(termErr) === true, "PrismaClientUnknownRequestError with 'terminating connection' is transient");

  const resetErr = new Prisma.PrismaClientUnknownRequestError("read ECONNRESET", {
    clientVersion: "6.0.0",
  });
  assert(isTransientDbError(resetErr) === true, "PrismaClientUnknownRequestError with 'ECONNRESET' is transient");

  // Duck-typed / wrapped errors
  assert(isTransientDbError({ code: "P1001" }) === true, "Duck-typed { code: 'P1001' } is transient");
  assert(isTransientDbError({ message: "connection closed by remote host" }) === true, "Duck-typed with closed message is transient");

  // --- Section 2: Non-Transient Error Detection ---
  console.log("\n2. Checking non-transient errors (should be FALSE):");

  const uniqueErr = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "6.0.0",
  });
  assert(isTransientDbError(uniqueErr) === false, "P2002 (Unique constraint) is NOT transient");

  const notFoundErr = new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "6.0.0",
  });
  assert(isTransientDbError(notFoundErr) === false, "P2025 (Record not found) is NOT transient");

  const valErr = new Prisma.PrismaClientValidationError("Invalid field value", {
    clientVersion: "6.0.0",
  });
  assert(isTransientDbError(valErr) === false, "PrismaClientValidationError is NOT transient");

  const unknownSyntaxErr = new Prisma.PrismaClientUnknownRequestError(
    "syntax error at or near 'SELEC'",
    { clientVersion: "6.0.0" }
  );
  assert(isTransientDbError(unknownSyntaxErr) === false, "Syntax error is NOT transient");

  assert(isTransientDbError(new Error("generic business logic error")) === false, "Generic Error is NOT transient");
  assert(isTransientDbError(null) === false, "null is NOT transient");
  assert(isTransientDbError(undefined) === false, "undefined is NOT transient");
  assert(isTransientDbError("error string") === false, "primitive string is NOT transient");

  // --- Section 3: withRetry Behavior ---
  console.log("\n3. Checking withRetry behavior:");

  // Test 3a: Success on first attempt
  let callsA = 0;
  const resultA = await withRetry(async () => {
    callsA++;
    return "success-first-try";
  });
  assert(resultA === "success-first-try" && callsA === 1, "withRetry returns value immediately on first success");

  // Test 3b: Transient error succeeds on 2nd attempt
  let callsB = 0;
  const resultB = await withRetry(async () => {
    callsB++;
    if (callsB === 1) {
      throw new Prisma.PrismaClientKnownRequestError("Pool connection timeout", {
        code: "P2024",
        clientVersion: "6.0.0",
      });
    }
    return "success-on-retry-2";
  });
  assert(resultB === "success-on-retry-2" && callsB === 2, "withRetry succeeds on second attempt after transient error");

  // Test 3c: Non-transient error throws immediately without retry
  let callsC = 0;
  let threwC = false;
  try {
    await withRetry(async () => {
      callsC++;
      throw new Prisma.PrismaClientKnownRequestError("Duplicate key", {
        code: "P2002",
        clientVersion: "6.0.0",
      });
    });
  } catch (err) {
    threwC = true;
    assert((err as Prisma.PrismaClientKnownRequestError).code === "P2002", "Non-transient error caught properly");
  }
  assert(threwC && callsC === 1, "withRetry throws non-transient error on attempt 1 without retrying");

  // Test 3d: Transient error exceeding 3 retries (4 attempts total) throws
  let callsD = 0;
  let threwD = false;
  try {
    await withRetry(async () => {
      callsD++;
      throw new Prisma.PrismaClientKnownRequestError("Continuous P1001", {
        code: "P1001",
        clientVersion: "6.0.0",
      });
    });
  } catch (err) {
    threwD = true;
    assert((err as Prisma.PrismaClientKnownRequestError).code === "P1001", "Max retries error caught properly");
  }
  assert(threwD && callsD === 4, "withRetry attempts 1 initial + 3 retries (4 total) then throws");

  // --- Summary ---
  console.log("\n========================================");
  console.log(`📊 Resilience Test Summary: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
