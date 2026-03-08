import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { APP_BUILD_ID_SHORT } from "@/lib/build";

// Communication unread counts (mock - matches CommunicationPage initial data)
const UNREAD_MESSAGES = 3; // messages with unread: true
const UNREAD_EMAILS = 2;   // emails with unread: true
const MISSED_CALLS = 1;    // calls with type "missed"

function getActiveItemFromPath(pathname: string): string {
  const segment = pathname.replace(/^\/dashboard\/?/, "") || "home";
  return segment;
}

const Index = () => {
  const location = useLocation();
  const activeMenuItem = getActiveItemFromPath(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const badgeCounts = useMemo(() => ({
    communication: UNREAD_MESSAGES + UNREAD_EMAILS + MISSED_CALLS,
  }), []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        activeItem={activeMenuItem}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        badgeCounts={badgeCounts}
      />

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-stone-100 px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Date indicator */}
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg">
                 <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-400" />
                 <span className="text-xs font-medium text-stone-500">
                   {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                 </span>
               </div>

               {/* Build indicator (helps verify everyone sees the same deployment) */}
               <div className="flex px-2.5 py-1.5 bg-stone-50 rounded-lg border border-stone-100">
                 <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">v</span>
                 <span className="ml-1.5 text-xs font-mono text-stone-500">{APP_BUILD_ID_SHORT}</span>
               </div>
             </div>

            {/* Notification Panel */}
            <NotificationPanel />
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
