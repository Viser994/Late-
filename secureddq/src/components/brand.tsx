import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-sm">
        <ShieldCheck className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-base tracking-tight">
          Secure<span className="text-primary">DDQ</span>
        </span>
      )}
    </span>
  );
}

export { APP_NAME };
