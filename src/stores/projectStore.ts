import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMyProjects } from '@/api/project';
import type { MyProjectResponseDto } from '@/lib/api/types';

export interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectStore {
  // Active project selection (persisted)
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;

  // My projects list from API (persisted)
  myProjects: MyProjectResponseDto[];
  myProjectsLoading: boolean;
  fetchMyProjects: () => Promise<void>;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      activeProject: null,
      myProjects: [],
      myProjectsLoading: false,

      setActiveProject: (project) => set({ activeProject: project }),

      fetchMyProjects: async () => {
        set({ myProjectsLoading: true });
        try {
          const res = await getMyProjects();
          if (res.success && res.data) {
            const projects = res.data;
            set({ myProjects: projects });

            // Auto-select: keep previous selection if still in list, otherwise pick first
            const prev = get().activeProject;
            const stillExists = prev && projects.some((p) => p.projId === prev.id);
            if (stillExists) {
              // Keep current selection
            } else if (projects.length > 0) {
              const first = projects[0];
              set({ activeProject: { id: first.projId, name: first.projNm ?? first.projId, status: 'active' } });
            } else {
              set({ activeProject: null });
            }
          }
        } catch {
          // Silently fail — keep existing list
        } finally {
          set({ myProjectsLoading: false });
        }
      },

      clearProjects: () => set({ myProjects: [], activeProject: null }),
    }),
    {
      name: 'pms-project',
      partialize: (state) => ({
        activeProject: state.activeProject,
        myProjects: state.myProjects,
      }),
    },
  ),
);
