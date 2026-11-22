// src/components/layout/Navbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare-store";
import { CommandPalette } from "./CommandPalette";
import { Kbd } from "@/components/ui/Kbd";
import { Search, Menu, X, Compass } from "lucide-react";
import { cn } from "@/lib/cn";

export function Navbar() {
  const pathname = usePathname();
  const { slugs } = useCompare();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isMac = React.useSyncExternalStore(
    () => () => {},
    () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent),
    () => true
  );

  const navLinks = [
    { href: "/", label: "Models", active: pathname === "/" || pathname.startsWith("/models") },
    {
      href: "/compare",
      label: "Compare",
      active: pathname.startsWith("/compare"),
      badge: slugs.length > 0 ? slugs.length : null,
    },
    { href: "/rankings", label: "Rankings", active: pathname.startsWith("/rankings") },
    { href: "/benchmarks", label: "Benchmarks", active: pathname.startsWith("/benchmarks") },
    { href: "/labs", label: "Labs", active: pathname.startsWith("/labs") },
    { href: "/providers", label: "Providers", active: pathname.startsWith("/providers") },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 group select-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-[8px] bg-cream-card text-cream-text border border-[#d5cfc2] flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-serif text-xl tracking-tight font-medium text-text">
                OneAtlas
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors select-none",
                    link.active
                      ? "bg-surface-raised text-text font-semibold border border-border-strong shadow-2xs"
                      : "text-muted hover:text-text hover:bg-surface/60"
                  )}
                >
                  <span>{link.label}</span>
                  {typeof link.badge === "number" && link.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#e5dfd2] text-[#1b1a17] rounded-full tabular-nums">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Action: Search Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center justify-between gap-2.5 h-9 px-2.5 sm:px-3 sm:w-64 bg-surface text-muted text-xs border border-border rounded-[10px] hover:border-border-strong hover:bg-surface-raised transition-colors cursor-pointer select-none"
              aria-label="Open command palette"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline truncate">Search catalog...</span>
              </div>
              <Kbd className="hidden sm:inline-flex">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted hover:text-text hover:bg-surface rounded-lg cursor-pointer"
              aria-label="Toggle mobile navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Slide-over Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-surface border-b border-border p-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    link.active
                      ? "bg-surface-raised text-text font-semibold border border-border-strong"
                      : "text-muted hover:text-text hover:bg-surface-raised/40"
                  )}
                >
                  <span>{link.label}</span>
                  {typeof link.badge === "number" && link.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-[#e5dfd2] text-[#1b1a17] rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
