"use client";

import { Bell, FileStack, Clock, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/utils";

const demoNotifications = [
  { id: "n1", icon: FileStack, title: "Review requested", body: "Marcus asked you to review 28 answers in Globex SOC 2 DDQ.", at: -1 },
  { id: "n2", icon: Clock, title: "Deadline approaching", body: "Acme Corp Vendor Assessment is due in 6 days.", at: -8 },
  { id: "n3", icon: AlertTriangle, title: "Document expiring", body: "Penetration Test Report expires in 21 days.", at: -24 },
  { id: "n4", icon: MessageSquare, title: "New mention", body: "Priya mentioned you on “Do we encrypt backups?”", at: -30 },
];

export function Notifications() {
  const unread = demoNotifications.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <span className="text-xs font-normal text-muted-foreground">{unread} new</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {demoNotifications.map((n) => (
            <div key={n.id} className="flex gap-3 px-3 py-3 hover:bg-accent/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <n.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(new Date(Date.now() + n.at * 3600_000))}</p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
