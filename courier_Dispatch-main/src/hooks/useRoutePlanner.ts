import { create } from 'zustand';
import { LoadNotification } from './useLoadNotifications';

interface RoutePlannerState {
  selectedLoads: LoadNotification[];
  addLoad: (load: LoadNotification) => void;
  removeLoad: (loadId: string) => void;
  clearRoute: () => void;
  isInRoute: (loadId: string) => boolean;
}

export const useRoutePlanner = create<RoutePlannerState>((set, get) => ({
  selectedLoads: [],
  
  addLoad: (load) => {
    const { selectedLoads } = get();
    if (!selectedLoads.find(l => l.id === load.id)) {
      set({ selectedLoads: [...selectedLoads, load] });
    }
  },
  
  removeLoad: (loadId) => {
    set((state) => ({
      selectedLoads: state.selectedLoads.filter(l => l.id !== loadId)
    }));
  },
  
  clearRoute: () => {
    set({ selectedLoads: [] });
  },
  
  isInRoute: (loadId) => {
    return get().selectedLoads.some(l => l.id === loadId);
  },
}));
