"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_dummy" &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.endsWith("...");

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (isDemoMode || !hasClerk) {
    return <AppProviders>{children}</AppProviders>;
  }

  return (
    <ClerkProvider>
      <AppProviders>{children}</AppProviders>
    </ClerkProvider>
  );
}
