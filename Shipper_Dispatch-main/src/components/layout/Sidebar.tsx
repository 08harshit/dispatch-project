import { useState } from "react";
import { Home, Truck, FileText, Settings, LogOut, BarChart3, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { useSidebarState } from "@/hooks/use-sidebar-state";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
}

const NavItem = ({ icon, label, to, active, collapsed, badge }: NavItemProps) => (
  <NavLink
    to={to}
    className={cn(
      "group relative flex items-center gap-3.5 w-full px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ease-out",
      active
        ? "text-primary"
        : "text-sidebar-muted hover:text-sidebar-foreground",
      collapsed && "justify-center px-2.5"
    )}
    title={collapsed ? label : undefined}
  >
    {/* Active background with gradient glow */}
    {active && (
      <div className="absolute inset-0 rounded-2xl bg-sidebar-accent transition-all duration-500 ease-out" />
    )}

    {/* Hover background */}
    <div className={cn(
      "absolute inset-0 rounded-2xl bg-sidebar-accent/0 transition-all duration-300 ease-out",
      !active && "group-hover:bg-sidebar-accent/50"
    )} />

    {/* Icon container with shaped background */}
    <div className={cn(
      "relative z-10 flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-300 ease-out",
      active
        ? "bg-primary shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.5)] scale-100"
        : "bg-transparent group-hover:bg-primary/10 group-hover:scale-105"
    )}>
      <span className={cn(
        "transition-colors duration-300",
        active ? "text-primary-foreground" : "text-sidebar-muted group-hover:text-primary"
      )}>
        {icon}
      </span>

      {/* Notification badge */}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow-sm ring-2 ring-sidebar-background animate-pulse">
          {badge}
        </span>
      )}
    </div>

    {/* Label */}
    {!collapsed && (
      <span className={cn(
        "relative z-10 flex-1 transition-all duration-300",
        active ? "font-semibold text-primary translate-x-0" : "translate-x-0 group-hover:translate-x-0.5"
      )}>
        {label}
      </span>
    )}

    {/* Active dot indicator */}
    {!collapsed && active && (
      <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]" />
    )}
  </NavLink>
);

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isCollapsed, toggleCollapsed } = useSidebarState();

  const navItems: { id: string; label: string; icon: React.ReactNode; path: string; badge?: number }[] = [
    { id: "home", label: "Home", icon: <Home size={20} />, path: "/" },
    { id: "shipping", label: "Shipping", icon: <Truck size={20} />, path: "/shipping" },
    { id: "accounting", label: "Accounting", icon: <FileText size={20} />, path: "/accounting" },
    { id: "communication", label: "Communication", icon: <MessageSquare size={20} />, path: "/communication", badge: 6 },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-out z-50",
      isCollapsed ? "w-20" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-5 py-5 transition-all duration-300",
        isCollapsed && "px-3 justify-center"
      )}>
        <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.45)]">
          <Truck className="w-5 h-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden flex flex-col">
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">Shipper</span>
            <span className="text-[10px] text-primary uppercase tracking-widest font-semibold">DISPATCH</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted hover:scale-110 transition-all duration-200 z-10"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Divider */}
      <div className="mx-4 border-t border-sidebar-border" />

      {/* Navigation */}
      <nav className={cn(
        "flex-1 px-3 py-4 space-y-0.5 transition-all duration-300",
        isCollapsed && "px-2"
      )}>
        {!isCollapsed && (
          <p className="px-3 py-2 text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Menu</p>
        )}
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            to={item.path}
            active={isActive(item.path)}
            collapsed={isCollapsed}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className={cn(
        "px-3 py-4 border-t border-sidebar-border space-y-0.5 transition-all duration-300",
        isCollapsed && "px-2"
      )}>
        <NavItem
          icon={<Settings size={20} />}
          label="Settings"
          to="/settings"
          active={isActive("/settings")}
          collapsed={isCollapsed}
        />
        <button
          onClick={() => console.log("Logout clicked")}
          className={cn(
            "group relative flex items-center gap-3.5 w-full px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 text-sidebar-muted hover:text-destructive",
            isCollapsed && "justify-center px-2.5"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="absolute inset-0 rounded-2xl bg-transparent group-hover:bg-destructive/8 transition-all duration-300" />
          <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-300 group-hover:bg-destructive/10">
            <LogOut size={20} className="shrink-0 transition-colors duration-300" />
          </div>
          {!isCollapsed && <span className="relative z-10">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
