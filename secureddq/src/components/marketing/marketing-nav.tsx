"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="SecureDDQ AI home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Start free</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 md:hidden">
          <div className="container flex flex-col gap-3 py-4">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
