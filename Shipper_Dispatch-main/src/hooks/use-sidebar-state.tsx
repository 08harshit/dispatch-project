import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarState = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    // Return default values if not in provider
    return { isCollapsed: false, setIsCollapsed: () => {}, toggleCollapsed: () => {} };
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarStateProvider = ({ children }: SidebarProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
