// src/components/layout/Footer.tsx
import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  const repoUrl =
    process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/adarshthakur/oneatlas";

  return (
    <footer className="w-full border-t border-border mt-20 py-10 bg-background text-muted text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-cream-card text-cream-text flex items-center justify-center font-bold text-xs">
            <Compass className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="font-serif text-sm font-medium text-text">OneAtlas</span>
          <span className="text-subtle">·</span>
          <span>Data: Real OpenRouter catalog &amp; cited academic benchmarks</span>
          <span className="text-subtle">·</span>
          <a
            href="https://artificialanalysis.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors underline decoration-border hover:decoration-muted underline-offset-2"
          >
            Benchmark data: Artificial Analysis
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="hover:text-text transition-colors">
            Models
          </Link>
          <Link href="/compare" className="hover:text-text transition-colors">
            Compare
          </Link>
          <Link href="/rankings" className="hover:text-text transition-colors">
            Rankings
          </Link>
          <Link href="/benchmarks" className="hover:text-text transition-colors">
            Benchmarks
          </Link>
          <Link href="/labs" className="hover:text-text transition-colors">
            Labs
          </Link>
          <Link href="/providers" className="hover:text-text transition-colors">
            Providers
          </Link>
          <a
            href="https://www.loom.com/share/c26d9ec5de514948b982c1fa8c09addd"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors"
          >
            Walkthrough
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-text transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
