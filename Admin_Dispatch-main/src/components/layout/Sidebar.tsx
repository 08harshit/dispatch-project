import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Truck,
  Package,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PackageOpen,
  TicketCheck,
  MessageCircle,
  FileText, // kept for potential future use
  MapPin,   // kept for potential future use
  KeyRound, // kept for potential future use
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Couriers", href: "/couriers", icon: Truck },
  { name: "Shippers", href: "/shippers", icon: Package },
  { name: "Loads", href: "/loads", icon: PackageOpen },
  // { name: "Contracts", href: "/contracts", icon: FileText }, // MODULE DISABLED
  { name: "Trips", href: "/trips", icon: MapPin },
  { name: "Communication", href: "/communication", icon: MessageCircle },
  // { name: "Vehicles", href: "/vehicles", icon: Truck }, // MODULE DISABLED
  // { name: "Vehicle Access", href: "/vehicle-access", icon: KeyRound }, // MODULE DISABLED
  { name: "Accounting", href: "/accounting", icon: Calculator },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Tickets", href: "/tickets", icon: TicketCheck },
];

const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-sidebar-border transition-all duration-300 sidebar-modern",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-ring" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">Admin</span>
              <span className="text-xs font-bold text-primary tracking-widest">DISPATCH</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow mx-auto">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-sidebar-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "nav-item group",
                isActive ? "nav-item-active" : "nav-item-inactive",
                collapsed && "justify-center px-2"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "relative flex items-center justify-center",
                isActive && "text-primary"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                )}
              </div>
              {!collapsed && (
                <span className="transition-all duration-200">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border/50 p-3 space-y-1">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "nav-item group",
                isActive ? "nav-item-active" : "nav-item-inactive",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                isActive && "text-primary",
                !isActive && "group-hover:scale-110"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
        <button
          onClick={handleLogout}
          className={cn(
            "nav-item w-full text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </aside>
  );
}
