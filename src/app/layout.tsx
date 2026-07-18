import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "SecureDDQ AI - Automate Security Questionnaires",
    template: "%s | SecureDDQ AI",
  },
  description:
    "AI-powered platform to automate security questionnaires, DDQs, and vendor assessments. Build your security knowledge base and answer questionnaires in minutes, not weeks.",
  keywords: [
    "security questionnaire",
    "DDQ automation",
    "vendor assessment",
    "SOC 2",
    "ISO 27001",
    "cybersecurity",
    "AI",
    "compliance",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SecureDDQ AI",
    title: "SecureDDQ AI - Automate Security Questionnaires",
    description:
      "AI-powered platform to automate security questionnaires with your organization's knowledge base.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecureDDQ AI",
    description: "Automate security questionnaires with AI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
