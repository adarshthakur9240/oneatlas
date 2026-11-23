#!/usr/bin/env tsx
/**
 * scripts/check-readme-assets.ts
 *
 * Parses README.md and verifies that every local image reference exists on disk.
 * Checks both markdown-style images  ![alt](path)  and HTML <img src="path"> tags.
 * Only checks paths that start with "docs/" (not http/https/data: URIs).
 *
 * Usage:  npx tsx scripts/check-readme-assets.ts
 * Exits:  0 if all assets exist, 1 if any are missing (with list printed to stderr).
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const README = path.join(ROOT, "README.md");

if (!fs.existsSync(README)) {
  console.error("ERROR: README.md not found at", README);
  process.exit(1);
}

const content = fs.readFileSync(README, "utf8");

// Collect all referenced local paths
const referenced = new Set<string>();

// Markdown image: ![alt text](docs/...)
for (const m of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  const ref = m[1].split(" ")[0].trim(); // strip optional title
  if (ref.startsWith("docs/") || ref.startsWith("./docs/")) {
    referenced.add(ref.replace(/^\.\//, ""));
  }
}

// HTML img tag: <img src="docs/...">
for (const m of content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) {
  const ref = m[1].trim();
  if (ref.startsWith("docs/") || ref.startsWith("./docs/")) {
    referenced.add(ref.replace(/^\.\//, ""));
  }
}

// HTML source tag: <source src="...">
for (const m of content.matchAll(/<source[^>]+src=["']([^"']+)["']/g)) {
  const ref = m[1].trim();
  if (ref.startsWith("docs/") || ref.startsWith("./docs/")) {
    referenced.add(ref.replace(/^\.\//, ""));
  }
}

if (referenced.size === 0) {
  console.log("No local docs/ asset references found in README.md.");
  process.exit(0);
}

const missing: string[] = [];
const found: string[] = [];

for (const ref of Array.from(referenced).sort()) {
  const abs = path.join(ROOT, ref);
  if (fs.existsSync(abs)) {
    found.push(ref);
  } else {
    missing.push(ref);
  }
}

console.log(`\nREADME Asset Check`);
console.log(`==================`);
console.log(`Total local references : ${referenced.size}`);
console.log(`Found                  : ${found.length}`);
console.log(`Missing                : ${missing.length}`);

if (missing.length > 0) {
  console.error(`\n❌ Missing assets (${missing.length}):`);
  for (const m of missing) {
    console.error(`   • ${m}`);
  }
  console.error(
    "\nPlease add the missing screenshots to docs/screens/ before merging."
  );
  process.exit(1);
} else {
  console.log(`\n✅ All ${found.length} referenced assets exist.`);
  process.exit(0);
}
