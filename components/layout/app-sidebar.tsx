"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  Tags,
  Wallet,
  Store,
  Lightbulb,
  Settings,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Upload CSV", href: "/dashboard/upload", icon: Upload },
  { title: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
];

const manageNav = [
  { title: "Budgets", href: "/dashboard/budgets", icon: Wallet },
  { title: "Categories", href: "/dashboard/categories", icon: Tags },
  { title: "Merchants", href: "/dashboard/merchants", icon: Store },
  { title: "Insights", href: "/dashboard/insights", icon: Lightbulb },
];

const settingsNav = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof mainNav;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  className={cn(
                    "rounded-lg transition-colors",
                    isActive &&
                      "bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border/80">
      <SidebarHeader className="border-b border-sidebar-border/80 px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">SpendScope</p>
            <p className="text-xs text-muted-foreground">Personal finance</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2 py-3">
        <NavGroup label="Overview" items={mainNav} pathname={pathname} />
        <NavGroup label="Manage" items={manageNav} pathname={pathname} />
        <NavGroup label="Account" items={settingsNav} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80 p-4">
        <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-xs font-medium">CSV upload only</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              No bank credentials stored
            </p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
