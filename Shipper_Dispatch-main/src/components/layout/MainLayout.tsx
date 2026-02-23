import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isCollapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "transition-all duration-300 ease-out px-8 py-6",
        isCollapsed ? "ml-20" : "ml-56"
      )}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
