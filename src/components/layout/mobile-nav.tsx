"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/constants/navigation";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            F1
          </div>
          <span className="font-semibold text-sidebar-foreground">
            Dashboard
          </span>
        </Link>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {NAV_SECTIONS.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.title && (
                <p className="mb-1 mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
