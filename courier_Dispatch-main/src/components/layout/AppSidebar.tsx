import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Truck, DollarSign, BarChart3, MessageCircle, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  activeItem: string;
  collapsed: boolean;
  onToggle: () => void;
  badgeCounts?: Record<string, number>;
}

const menuItems = [
  { id: "home", label: "Home", icon: Home, path: "/dashboard", gradient: "from-amber-400 to-amber-500", light: "bg-amber-50", text: "text-amber-600" },
  { id: "loads", label: "Loads", icon: Truck, path: "/dashboard/loads", gradient: "from-amber-500 to-orange-400", light: "bg-amber-50", text: "text-amber-600" },
  { id: "saved", label: "Saved Loads", icon: Bookmark, path: "/dashboard/saved", gradient: "from-orange-400 to-rose-400", light: "bg-orange-50", text: "text-orange-600" },
  { id: "accounting", label: "Accounting", icon: DollarSign, path: "/dashboard/accounting", gradient: "from-emerald-400 to-teal-400", light: "bg-emerald-50", text: "text-emerald-600" },
  { id: "communication", label: "Communication", icon: MessageCircle, path: "/dashboard/communication", gradient: "from-sky-400 to-blue-400", light: "bg-sky-50", text: "text-sky-600" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/dashboard/analytics", gradient: "from-teal-400 to-emerald-400", light: "bg-emerald-50", text: "text-emerald-600" },
];

export const AppSidebar = ({ activeItem, collapsed, onToggle, badgeCounts = {} }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className={cn(
      "bg-white min-h-screen flex flex-col transition-all duration-500 relative overflow-hidden",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Background decorative orbs */}
      <div className="absolute top-20 -left-10 w-32 h-32 bg-gradient-to-br from-amber-100/40 to-orange-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-20 h-20 bg-gradient-to-br from-amber-100/20 to-amber-200/20 rounded-full blur-2xl pointer-events-none" />
      
      {/* Elegant right border with gradient */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-amber-200/50 to-transparent" />
      
      {/* Logo Section */}
      <div className="p-5 flex items-center gap-3 relative z-10">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="h-5 w-5 text-white" strokeWidth={2} />
            {/* Sparkle overlay */}
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300 animate-pulse" />
          </div>
        </div>
        
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-stone-800 text-sm tracking-tight">Courier</span>
            <span className="text-[8px] text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 uppercase tracking-[0.2em] font-semibold">Dispatch</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 h-6 w-6 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:border-amber-300 transition-all z-20 group"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-stone-400 group-hover:text-amber-500 transition-colors" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-stone-400 group-hover:text-amber-500 transition-colors" />
        )}
      </button>

      {/* Decorative divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 relative z-10">
        {!collapsed && (
          <p className="text-[8px] text-stone-400 uppercase tracking-[0.2em] font-semibold mb-3 px-3 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
            Menu
          </p>
        )}
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.id === "home"}
                  className={cn(
                    "w-full flex items-center gap-3 text-sm py-2.5 px-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    collapsed && "justify-center",
                    isActive
                      ? item.light
                      : "hover:bg-amber-50/50"
                  )}
                >
                  {/* Active gradient border effect */}
                  {isActive && (
                    <>
                      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b rounded-full", item.gradient)} />
                      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-5", item.gradient)} />
                    </>
                  )}
                  
                  {/* Icon container */}
                  <div className="relative">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? cn("bg-gradient-to-br shadow-sm", item.gradient)
                        : cn("bg-stone-100 group-hover:", item.light)
                    )}>
                      <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-white" : cn("text-stone-400 group-hover:", item.text)
                      )} strokeWidth={2} />
                      {isActive && (
                        <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    {/* Badge on icon */}
                    {badgeCounts[item.id] > 0 && (
                      <div className={cn(
                        "absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full text-[9px] font-bold text-white shadow-md z-10",
                        `bg-gradient-to-r ${item.gradient}`
                      )}>
                        {badgeCounts[item.id] > 9 ? "9+" : badgeCounts[item.id]}
                      </div>
                    )}
                  </div>
                  
                  {!collapsed && (
                    <span className={cn(
                      "font-medium transition-colors",
                      isActive ? item.text : "text-stone-500 group-hover:text-stone-600"
                    )}>
                      {item.label}
                    </span>
                  )}
                  
                  {/* Active indicator dot */}
                  {isActive && !collapsed && !badgeCounts[item.id] && (
                    <div className={cn("absolute right-3 w-1.5 h-1.5 rounded-full bg-gradient-to-r animate-pulse", item.gradient)} />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-1 relative z-10">
        {/* Decorative divider */}
        <div className="mx-1 mb-2 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        
        <NavLink
          to="/dashboard/setup"
          className={cn(
            "w-full flex items-center gap-3 text-sm py-2.5 px-3 rounded-xl hover:bg-amber-50 transition-all duration-300 group",
            collapsed && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-stone-100 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-500 flex items-center justify-center transition-all duration-300">
            <Settings className="h-4 w-4 text-stone-400 group-hover:text-white group-hover:rotate-90 transition-all duration-500" strokeWidth={2} />
          </div>
          {!collapsed && <span className="font-medium text-stone-500 group-hover:text-amber-600 transition-colors">Settings</span>}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 text-sm py-2.5 px-3 rounded-xl hover:bg-emerald-50 transition-all duration-300 group",
            collapsed && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-stone-100 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-teal-400 flex items-center justify-center transition-all duration-300">
            <LogOut className="h-4 w-4 text-stone-400 group-hover:text-white transition-colors" strokeWidth={2} />
          </div>
          {!collapsed && <span className="font-medium text-stone-500 group-hover:text-emerald-600 transition-colors">Logout</span>}
        </button>
      </div>
    </aside>
  );
};