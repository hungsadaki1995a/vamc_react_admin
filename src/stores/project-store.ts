import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectStore {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProject: null,

      setActiveProject: (project) => set({ activeProject: project }),

      clearProjects: () => set({ activeProject: null }),
    }),
    {
      name: 'vamc-project',
      partialize: (state) => ({
        activeProject: state.activeProject,
      }),
    },
  ),
);
