import React, { createContext, useContext, useState } from 'react';

export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  sidebarWidth: SIDEBAR_EXPANDED_WIDTH,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c), sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
