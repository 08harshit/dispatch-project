import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { HomePage } from "@/pages/HomePage";
import { LoadsPage } from "@/pages/LoadsPage";
import { SavedLoadsPage } from "@/pages/SavedLoadsPage";
import { AccountingPage } from "@/pages/AccountingPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CommunicationPage } from "@/pages/CommunicationPage";
import { SetupPage } from "@/pages/SetupPage";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { APP_BUILD_ID_SHORT } from "@/lib/build";

// Communication unread counts (mock — matches CommunicationPage initial data)
const UNREAD_MESSAGES = 3; // messages with unread: true
const UNREAD_EMAILS = 2;   // emails with unread: true
const MISSED_CALLS = 1;    // calls with type "missed"

const Index = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const badgeCounts = useMemo(() => ({
    communication: UNREAD_MESSAGES + UNREAD_EMAILS + MISSED_CALLS,
  }), []);

  const renderPage = () => {
    switch (activeMenuItem) {
      case "home":
        return <HomePage onNavigate={setActiveMenuItem} />;
      case "loads":
        return <LoadsPage />;
      case "saved":
        return <SavedLoadsPage />;
      case "accounting":
        return <AccountingPage />;
      case "communication":
        return <CommunicationPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "setup":
        return <SetupPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar 
        activeItem={activeMenuItem} 
        onItemClick={setActiveMenuItem}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
               <div className="flex items-center px-2.5 py-1.5 bg-stone-50 rounded-lg border border-stone-100">
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
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
