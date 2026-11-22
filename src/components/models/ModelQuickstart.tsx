// src/components/models/ModelQuickstart.tsx
"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Terminal } from "lucide-react";

interface ModelQuickstartProps {
  sourceId: string;
  modelName: string;
}

export function ModelQuickstart({ sourceId, modelName }: ModelQuickstartProps) {
  const [tab, setTab] = React.useState<"curl" | "ts" | "py">("curl");

  const curlCode = `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${sourceId}",
    "messages": [
      {"role": "user", "content": "Explain quantum computing in one sentence."}
    ]
  }'`;

  const tsCode = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "${sourceId}",
  messages: [
    { role: "user", content: "Explain quantum computing in one sentence." }
  ],
});

console.log(completion.choices[0].message.content);`;

  const pyCode = `from openai import OpenAI
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
)

completion = client.chat.completions.create(
    model="${sourceId}",
    messages=[
        {"role": "user", "content": "Explain quantum computing in one sentence."}
    ],
)

print(completion.choices[0].message.content)`;

  const activeCode = tab === "curl" ? curlCode : tab === "ts" ? tsCode : pyCode;

  return (
    <div className="bg-surface border border-border rounded-[16px] overflow-hidden select-none shadow-xs">
      {/* Code Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted" />
          <span className="text-xs font-mono font-medium text-text">
            Developer Quickstart ({modelName})
          </span>
        </div>

        {/* Tab Switcher & Copy */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-0.5 rounded-[8px] bg-surface border border-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setTab("curl")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                tab === "curl"
                  ? "bg-surface-raised text-text font-bold"
                  : "text-muted hover:text-text"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setTab("ts")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                tab === "ts"
                  ? "bg-surface-raised text-text font-bold"
                  : "text-muted hover:text-text"
              }`}
            >
              TypeScript
            </button>
            <button
              type="button"
              onClick={() => setTab("py")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                tab === "py"
                  ? "bg-surface-raised text-text font-bold"
                  : "text-muted hover:text-text"
              }`}
            >
              Python
            </button>
          </div>

          <CopyButton value={activeCode} label="Copy snippet" />
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="p-4 bg-[#141412] overflow-x-auto text-xs font-mono text-text">
        <pre className="leading-relaxed selection:bg-border-strong select-all">
          <code>{activeCode}</code>
        </pre>
      </div>

      {/* Note about provider routing */}
      <div className="px-4 py-2.5 border-t border-border bg-surface-raised/30 text-[11px] font-mono text-muted flex items-center justify-between">
        <span>
          Tip: You can pin provider routing via OpenRouter headers (e.g.{" "}
          <code className="text-text">order: [&quot;Together&quot;, &quot;DeepInfra&quot;]</code>).
        </span>
        <span className="text-subtle">OpenAI-compatible API</span>
      </div>
    </div>
  );
}
