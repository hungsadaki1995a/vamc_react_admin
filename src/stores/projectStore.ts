import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockLoadProjects } from '@/mock/services/projectService';
import type { MyProjectResponseDto } from '@/lib/api/types';

export interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectStore {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
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
          const projects = await mockLoadProjects();
          set({ myProjects: projects });
          const prev = get().activeProject;
          const stillExists = prev && projects.some((p) => p.projId === prev.id);
          if (!stillExists && projects.length > 0) {
            const first = projects[0];
            set({ activeProject: { id: first.projId, name: first.projNm ?? first.projId, status: 'active' } });
          } else if (projects.length === 0) {
            set({ activeProject: null });
          }
        } catch {
          // silent
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
