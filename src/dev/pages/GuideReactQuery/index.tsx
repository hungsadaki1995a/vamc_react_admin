import { Tabs, Card, Alert } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';

// 기본 설정 코드
const setupCode = `// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분 (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}`;

const optionsExplanation = `// 주요 옵션 설명
{
  staleTime: 5 * 60 * 1000,
  // 데이터가 "신선한(fresh)" 상태로 유지되는 시간
  // 이 시간 내에는 다시 fetch하지 않음
  // 기본값: 0 (즉시 stale)

  gcTime: 30 * 60 * 1000,
  // 캐시에서 메모리 해제되기까지의 시간
  // 컴포넌트가 언마운트된 후에도 이 시간동안 캐시 유지
  // 기본값: 5분

  retry: 1,
  // 실패 시 재시도 횟수
  // false로 설정하면 재시도 안 함

  refetchOnWindowFocus: false,
  // 윈도우 포커스 시 자동 갱신 여부
  // 기본값: true
}`;

// useQuery 기본 사용법
const useQueryBasic = `import { useQuery } from '@tanstack/react-query';

function ProjectList() {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Network error');
      return response.json();
    },
  });

  if (isLoading) return <Spin />;
  if (isError) return <Alert title={error.message} type="error" />;

  return (
    <div>
      {isFetching && <Tag>갱신 중...</Tag>}
      <Button onClick={() => refetch()}>새로고침</Button>
      {data?.map(project => <div key={project.id}>{project.name}</div>)}
    </div>
  );
}`;

const queryKeyDesign = `// QueryKey 설계 패턴

// 1. 단일 리소스
['projects']
['users']

// 2. 리소스 + ID
['project', projectId]
['user', userId]

// 3. 리소스 + 필터/파라미터
['projects', { status: 'active', page: 1 }]
['tasks', { assignee: userId, completed: false }]

// 4. 중첩된 관계
['project', projectId, 'tasks']
['project', projectId, 'members']

// 5. 실전 예시
function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
  });
}

function useProjectTasks(projectId: string, filters: TaskFilters) {
  return useQuery({
    queryKey: ['project', projectId, 'tasks', filters],
    queryFn: () => fetchProjectTasks(projectId, filters),
  });
}

// 키가 배열이므로 deep equality로 비교됨
// 필터 객체의 내용이 같으면 같은 캐시를 사용`;

const enabledOption = `// enabled: 조건부 쿼리 실행

function TaskDetail({ taskId }: { taskId?: string }) {
  // taskId가 있을 때만 쿼리 실행
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId!),
    enabled: !!taskId, // taskId가 truthy일 때만 실행
  });

  // 의존적 쿼리: task를 먼저 가져온 후 comments 가져오기
  const { data: comments } = useQuery({
    queryKey: ['task', taskId, 'comments'],
    queryFn: () => fetchComments(taskId!),
    enabled: !!task, // task 데이터가 있을 때만 실행
  });

  return <div>{/* ... */}</div>;
}`;

const selectOption = `// select: 데이터 변환 및 메모이제이션

function ProjectMembers({ projectId }: { projectId: string }) {
  // 서버에서 받은 데이터를 변환하여 사용
  const { data: activeMembers } = useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => fetchProjectMembers(projectId),
    select: (data) => {
      // 활성 멤버만 필터링 + 이름순 정렬
      return data
        .filter(member => member.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  // select는 메모이제이션됨 - data가 변경될 때만 재실행
  return <div>{activeMembers?.map(/* ... */)}</div>;
}

// 통계 계산 예시
function TaskStats({ projectId }: { projectId: string }) {
  const { data: stats } = useQuery({
    queryKey: ['project', projectId, 'tasks'],
    queryFn: () => fetchProjectTasks(projectId),
    select: (tasks) => ({
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
    }),
  });

  return <div>완료: {stats?.completed} / {stats?.total}</div>;
}`;

const placeholderInitialData = `// placeholderData vs initialData

// placeholderData: 임시 데이터 (캐시에 저장 안 됨)
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    placeholderData: {
      id: userId,
      name: '로딩 중...',
      email: '',
    },
  });

  // 로딩 중에도 placeholder 데이터가 표시됨
  return <div>{user.name}</div>; // isLoading 체크 불필요
}

// initialData: 초기 캐시 데이터 (캐시에 저장됨)
function ProjectDetail({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    initialData: () => {
      // 기존 프로젝트 목록 캐시에서 데이터 추출
      return queryClient
        .getQueryData<Project[]>(['projects'])
        ?.find(p => p.id === projectId);
    },
    // initialData가 있어도 staleTime이 지나면 백그라운드 갱신
  });

  return <div>{project?.name}</div>;
}`;

// useMutation 코드
const useMutationBasic = `import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateProjectForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newProject: NewProject) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: (data) => {
      // 성공 시 프로젝트 목록 캐시 무효화 → 자동 갱신
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('프로젝트가 생성되었습니다');
    },
    onError: (error) => {
      message.error(\`생성 실패: \${error.message}\`);
    },
    onSettled: () => {
      // 성공/실패 관계없이 항상 실행
      console.log('Mutation completed');
    },
  });

  const handleSubmit = (values: NewProject) => {
    mutation.mutate(values);
  };

  return (
    <Form onFinish={handleSubmit}>
      {/* ... */}
      <Button
        type="primary"
        htmlType="submit"
        loading={mutation.isPending}
      >
        생성
      </Button>
    </Form>
  );
}`;

const mutationCallbacks = `// Mutation 콜백 패턴

const updateTaskMutation = useMutation({
  mutationFn: (task: Task) => updateTask(task.id, task),

  // 1. onMutate: 뮤테이션 시작 전 (낙관적 업데이트에 사용)
  onMutate: async (newTask) => {
    console.log('뮤테이션 시작:', newTask);
    // context를 반환하면 다른 콜백에서 사용 가능
    return { timestamp: Date.now() };
  },

  // 2. onSuccess: 성공 시
  onSuccess: (data, variables, context) => {
    console.log('성공:', data);
    console.log('입력값:', variables);
    console.log('Context:', context); // { timestamp: ... }
  },

  // 3. onError: 실패 시
  onError: (error, variables, context) => {
    console.error('실패:', error);
  },

  // 4. onSettled: 성공/실패 관계없이 항상 실행
  onSettled: (data, error, variables, context) => {
    console.log('완료');
  },
});`;

const mutateVsMutateAsync = `// mutate vs mutateAsync

// mutate: 콜백 기반 (권장)
const mutation = useMutation({ mutationFn: createProject });

const handleCreate = (values: NewProject) => {
  mutation.mutate(values, {
    onSuccess: () => {
      message.success('생성 완료');
      navigate('/projects');
    },
  });
};

// mutateAsync: Promise 반환 (try-catch 필요)
const handleCreateAsync = async (values: NewProject) => {
  try {
    const result = await mutation.mutateAsync(values);
    message.success('생성 완료');
    navigate(\`/projects/\${result.id}\`);
  } catch (error) {
    message.error('생성 실패');
  }
};

// 여러 뮤테이션을 순차 실행할 때 mutateAsync 유용
const handleBatch = async () => {
  try {
    const project = await createMutation.mutateAsync(projectData);
    const task = await createTaskMutation.mutateAsync({
      ...taskData,
      projectId: project.id,
    });
    message.success('프로젝트와 업무가 생성되었습니다');
  } catch (error) {
    message.error('생성 실패');
  }
};`;

const invalidateQueries = `// 관련 쿼리 무효화 및 갱신

const queryClient = useQueryClient();

// 1. 특정 키 무효화
queryClient.invalidateQueries({ queryKey: ['projects'] });

// 2. 특정 ID 무효화
queryClient.invalidateQueries({ queryKey: ['project', projectId] });

// 3. 접두사로 여러 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['project', projectId] });
// → ['project', 'P001'], ['project', 'P001', 'tasks'],
//   ['project', 'P001', 'members'] 모두 무효화

// 4. 실전 예시: 업무 수정 시 관련 쿼리 모두 갱신
const updateTaskMutation = useMutation({
  mutationFn: (task: Task) => updateTask(task.id, task),
  onSuccess: (_, variables) => {
    // 업무 상세
    queryClient.invalidateQueries({
      queryKey: ['task', variables.id],
    });
    // 프로젝트의 업무 목록
    queryClient.invalidateQueries({
      queryKey: ['project', variables.projectId, 'tasks'],
    });
    // 전체 업무 목록
    queryClient.invalidateQueries({
      queryKey: ['tasks'],
    });
  },
});`;

// 캐싱 전략 코드
const staleTimeVsGcTime = `// staleTime vs gcTime 차이점

/**
 * staleTime (신선도 시간)
 * - 데이터가 "fresh" 상태로 유지되는 시간
 * - fresh 상태일 때는 서버에 요청하지 않고 캐시 사용
 * - 기본값: 0 (즉시 stale 상태가 됨)
 */

/**
 * gcTime (가비지 컬렉션 시간, 구 cacheTime)
 * - 사용하지 않는 캐시를 메모리에서 제거하기까지의 시간
 * - 컴포넌트가 언마운트되어도 이 시간동안 캐시 유지
 * - 기본값: 5분
 */

// 시나리오:
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 60 * 1000, // 1분
  gcTime: 5 * 60 * 1000, // 5분
});

/**
 * 타임라인:
 *
 * 0초: 쿼리 실행, 데이터 fetch → fresh 상태
 * 0~60초: fresh 상태, 다시 마운트되어도 fetch 안 함
 * 60초: stale 상태로 전환
 * 60초~: stale 상태, 다시 마운트되면 백그라운드 fetch
 * 컴포넌트 언마운트: 캐시는 유지 (gcTime만큼)
 * 언마운트 후 5분: 캐시 메모리에서 제거
 *
 * 다시 마운트 시:
 * - gcTime 내: 캐시 사용 + 백그라운드 fetch
 * - gcTime 후: 캐시 없음, 처음부터 fetch
 */`;

const queryInvalidation = `// 쿼리 무효화 및 리셋

const queryClient = useQueryClient();

// 1. invalidateQueries: stale 상태로 변경 + 자동 갱신
queryClient.invalidateQueries({ queryKey: ['projects'] });
// - 마운트된 쿼리는 즉시 refetch
// - 언마운트된 쿼리는 다음 마운트 시 refetch

// 2. resetQueries: 캐시 제거 + stale 상태
queryClient.resetQueries({ queryKey: ['projects'] });
// - 캐시 데이터를 initialData로 되돌림 (없으면 제거)

// 3. removeQueries: 캐시 완전 제거
queryClient.removeQueries({ queryKey: ['projects'] });
// - 캐시 메모리에서 완전 삭제

// 4. 필터링 무효화
queryClient.invalidateQueries({
  queryKey: ['projects'],
  exact: true, // 정확히 일치하는 것만
});

queryClient.invalidateQueries({
  queryKey: ['projects'],
  refetchType: 'active', // active | inactive | all
});

// 5. predicate로 조건부 무효화
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'project' &&
    query.queryKey[1] === projectId,
});`;

const prefetching = `// 쿼리 프리페칭 (사전 로딩)

const queryClient = useQueryClient();

// 1. 기본 프리페칭
const handleMouseEnter = (projectId: string) => {
  // 마우스 오버 시 미리 데이터 로드
  queryClient.prefetchQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    staleTime: 60 * 1000, // 1분간 fresh 유지
  });
};

// 2. 페이지네이션 다음 페이지 프리페칭
function ProjectList({ page }: { page: number }) {
  const { data } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
  });

  // 현재 페이지 로드 시 다음 페이지 미리 로드
  useEffect(() => {
    if (data?.hasNext) {
      queryClient.prefetchQuery({
        queryKey: ['projects', page + 1],
        queryFn: () => fetchProjects(page + 1),
      });
    }
  }, [data, page]);

  return <div>{/* ... */}</div>;
}

// 3. 라우터 네비게이션 전 프리페칭
const navigate = useNavigate();

const handleNavigate = (projectId: string) => {
  // 페이지 이동 전 데이터 미리 로드
  queryClient.prefetchQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });
  navigate(\`/projects/\${projectId}\`);
};`;

const manualCacheUpdate = `// 쿼리 데이터 직접 조작

const queryClient = useQueryClient();

// 1. setQueryData: 캐시 직접 수정
const addProjectMutation = useMutation({
  mutationFn: createProject,
  onSuccess: (newProject) => {
    // 기존 목록에 새 프로젝트 추가 (서버 재요청 없이)
    queryClient.setQueryData<Project[]>(
      ['projects'],
      (oldData) => [...(oldData || []), newProject]
    );
  },
});

// 2. getQueryData: 캐시 데이터 읽기
const projects = queryClient.getQueryData<Project[]>(['projects']);
console.log('캐시된 프로젝트:', projects);

// 3. 낙관적 업데이트 패턴
const deleteProjectMutation = useMutation({
  mutationFn: deleteProject,
  onMutate: async (projectId) => {
    // 진행 중인 쿼리 취소
    await queryClient.cancelQueries({ queryKey: ['projects'] });

    // 이전 데이터 백업
    const previous = queryClient.getQueryData(['projects']);

    // 낙관적으로 캐시 업데이트
    queryClient.setQueryData<Project[]>(
      ['projects'],
      (old) => old?.filter(p => p.id !== projectId)
    );

    return { previous }; // 롤백용
  },
  onError: (err, projectId, context) => {
    // 실패 시 이전 데이터로 롤백
    if (context?.previous) {
      queryClient.setQueryData(['projects'], context.previous);
    }
  },
  onSettled: () => {
    // 성공/실패 관계없이 서버 데이터로 갱신
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});

// 4. 부분 업데이트
queryClient.setQueryData<Project>(
  ['project', projectId],
  (oldData) => oldData ? { ...oldData, name: 'New Name' } : oldData
);`;

// 고급 패턴 코드
const optimisticUpdate = `// 낙관적 업데이트 전체 패턴

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
}

const updateTaskMutation = useMutation({
  mutationFn: async (task: Task) => {
    const response = await fetch(\`/api/tasks/\${task.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Update failed');
    return response.json();
  },

  // Step 1: 뮤테이션 시작 전
  onMutate: async (updatedTask) => {
    // 1-1. 진행 중인 refetch 취소 (낙관적 업데이트 덮어쓰기 방지)
    await queryClient.cancelQueries({
      queryKey: ['project', updatedTask.projectId, 'tasks'],
    });

    // 1-2. 이전 데이터 스냅샷 (롤백용)
    const previousTasks = queryClient.getQueryData<Task[]>([
      'project',
      updatedTask.projectId,
      'tasks',
    ]);

    // 1-3. 낙관적으로 UI 즉시 업데이트
    queryClient.setQueryData<Task[]>(
      ['project', updatedTask.projectId, 'tasks'],
      (old) =>
        old?.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
    );

    // 1-4. 롤백에 필요한 컨텍스트 반환
    return { previousTasks };
  },

  // Step 2: 에러 발생 시 롤백
  onError: (err, updatedTask, context) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(
        ['project', updatedTask.projectId, 'tasks'],
        context.previousTasks
      );
    }
    message.error('업데이트 실패');
  },

  // Step 3: 성공/실패 관계없이 서버 데이터로 동기화
  onSettled: (data, error, updatedTask) => {
    queryClient.invalidateQueries({
      queryKey: ['project', updatedTask.projectId, 'tasks'],
    });
  },
});

// 사용 예시: 드래그 앤 드롭으로 상태 변경
const handleDrop = (taskId: string, newStatus: Task['status']) => {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    updateTaskMutation.mutate({ ...task, status: newStatus });
    // UI는 즉시 업데이트됨 (onMutate)
    // 서버 실패 시 자동 롤백 (onError)
  }
};`;

const infiniteQuery = `// useInfiniteQuery (무한 스크롤)

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface TaskPage {
  tasks: Task[];
  nextCursor?: string;
  hasNext: boolean;
}

function InfiniteTaskList({ projectId }: { projectId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['project', projectId, 'tasks', 'infinite'],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        \`/api/projects/\${projectId}/tasks?cursor=\${pageParam || ''}\`
      );
      return response.json() as Promise<TaskPage>;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // 다음 페이지 파라미터 반환
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
  });

  // Intersection Observer로 자동 로딩
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Spin />;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.tasks.map((task) => (
            <div key={task.id}>{task.title}</div>
          ))}
        </div>
      ))}

      {/* 감지 영역 */}
      <div ref={ref} style={{ height: 20 }}>
        {isFetchingNextPage && <Spin />}
      </div>

      {!hasNextPage && <div>모든 데이터를 불러왔습니다</div>}
    </div>
  );
}

// 페이지 번호 기반 무한 스크롤
const infiniteQueryWithPage = useInfiniteQuery({
  queryKey: ['tasks', 'infinite'],
  queryFn: ({ pageParam = 1 }) => fetchTasks(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.hasNext ? allPages.length + 1 : undefined;
  },
});`;

const parallelDependentQueries = `// 병렬 쿼리 및 종속 쿼리

// 1. 병렬 쿼리: 동시에 여러 데이터 로드
function Dashboard() {
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // 모든 쿼리가 로딩 중인지 체크
  const isLoading =
    projectsQuery.isLoading ||
    tasksQuery.isLoading ||
    usersQuery.isLoading;

  if (isLoading) return <Spin />;

  return (
    <div>
      <ProjectStats projects={projectsQuery.data} />
      <TaskStats tasks={tasksQuery.data} />
      <UserStats users={usersQuery.data} />
    </div>
  );
}

// 2. useQueries: 동적 개수의 병렬 쿼리
function MultiProjectView({ projectIds }: { projectIds: string[] }) {
  const projectQueries = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ['project', id],
      queryFn: () => fetchProject(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = projectQueries.some((q) => q.isLoading);
  const projects = projectQueries.map((q) => q.data).filter(Boolean);

  return <div>{projects.map((p) => <ProjectCard project={p} />)}</div>;
}

// 3. 종속 쿼리: 이전 쿼리 결과로 다음 쿼리 실행
function UserProfile({ userId }: { userId: string }) {
  // 먼저 사용자 정보 가져오기
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // 사용자의 부서 정보 가져오기 (user 로드 후)
  const { data: department } = useQuery({
    queryKey: ['department', user?.departmentId],
    queryFn: () => fetchDepartment(user!.departmentId),
    enabled: !!user?.departmentId, // user가 있을 때만 실행
  });

  // 부서의 프로젝트 목록 가져오기 (department 로드 후)
  const { data: projects } = useQuery({
    queryKey: ['department', department?.id, 'projects'],
    queryFn: () => fetchDepartmentProjects(department!.id),
    enabled: !!department?.id,
  });

  return <div>{/* ... */}</div>;
}`;

const queryCancellation = `// 쿼리 취소 (AbortSignal)

// 1. 기본 쿼리 취소
const searchQuery = useQuery({
  queryKey: ['search', searchTerm],
  queryFn: async ({ signal }) => {
    // AbortSignal을 fetch에 전달
    const response = await fetch(
      \`/api/search?q=\${searchTerm}\`,
      { signal } // 쿼리가 취소되면 fetch도 중단
    );
    return response.json();
  },
  enabled: searchTerm.length > 2,
});

// searchTerm이 바뀌면 이전 쿼리는 자동 취소됨

// 2. Axios와 함께 사용
import axios from 'axios';

const axiosQuery = useQuery({
  queryKey: ['data'],
  queryFn: async ({ signal }) => {
    const { data } = await axios.get('/api/data', {
      signal, // Axios도 AbortSignal 지원
    });
    return data;
  },
});

// 3. 수동 취소
const queryClient = useQueryClient();

const handleCancel = () => {
  queryClient.cancelQueries({ queryKey: ['search'] });
};

// 4. 컴포넌트 언마운트 시 자동 취소
useEffect(() => {
  return () => {
    // 언마운트 시 진행 중인 쿼리 취소
    queryClient.cancelQueries({ queryKey: ['longRunning'] });
  };
}, []);

// 5. 타임아웃 구현
const queryWithTimeout = useQuery({
  queryKey: ['data'],
  queryFn: async ({ signal }) => {
    const timeoutId = setTimeout(() => {
      // 5초 후 강제 취소
      queryClient.cancelQueries({ queryKey: ['data'] });
    }, 5000);

    try {
      const response = await fetch('/api/slow', { signal });
      clearTimeout(timeoutId);
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
});`;

export default function GuideReactQuery() {
  const tabItems = [
    {
      key: 'setup',
      label: '기본 설정',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="TanStack React Query는 서버 상태 관리를 위한 강력한 라이브러리입니다"
            description="데이터 페칭, 캐싱, 동기화, 서버 상태 업데이트를 선언적으로 처리할 수 있습니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>QueryClient 설정 및 Provider 래핑</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              앱 최상위에서 QueryClientProvider로 래핑하고 기본 옵션을 설정합니다.
            </p>
            <CodeSnippet code={setupCode} title="main.tsx" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>주요 옵션 설명</h3>
            <CodeSnippet code={optionsExplanation} title="옵션 설명" />
          </div>
        </div>
      ),
    },
    {
      key: 'useQuery',
      label: 'useQuery',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="useQuery는 데이터 조회(GET)를 위한 훅입니다"
            description="queryKey와 queryFn을 제공하면 자동으로 캐싱, 리페칭, 에러 처리를 수행합니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>기본 사용법</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              queryKey는 캐시 키, queryFn은 데이터를 가져오는 비동기 함수입니다.
              반환값으로 data, isLoading, isError, error, isFetching, refetch를 받습니다.
            </p>
            <CodeSnippet code={useQueryBasic} title="기본 사용 예시" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>QueryKey 설계</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              queryKey는 배열 형태로 작성하며, 리소스, ID, 필터 등을 포함할 수 있습니다.
              키가 변경되면 새로운 캐시 엔트리로 간주됩니다.
            </p>
            <CodeSnippet code={queryKeyDesign} title="QueryKey 패턴" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>enabled 옵션 (조건부 쿼리)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              enabled를 사용하면 특정 조건이 만족될 때만 쿼리를 실행할 수 있습니다.
              종속 쿼리(dependent queries)를 구현할 때 유용합니다.
            </p>
            <CodeSnippet code={enabledOption} title="enabled 옵션" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>select 옵션 (데이터 변환)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              select를 사용하면 쿼리 결과를 변환하거나 필터링할 수 있습니다.
              변환 결과는 메모이제이션되어 불필요한 재계산을 방지합니다.
            </p>
            <CodeSnippet code={selectOption} title="select 옵션" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>placeholderData vs initialData</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              placeholderData는 로딩 중 임시로 표시할 데이터, initialData는 캐시에 저장될 초기 데이터입니다.
            </p>
            <CodeSnippet code={placeholderInitialData} title="placeholderData & initialData" />
          </div>
        </div>
      ),
    },
    {
      key: 'useMutation',
      label: 'useMutation',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="useMutation은 데이터 생성, 수정, 삭제(POST/PUT/DELETE)를 위한 훅입니다"
            description="성공/실패 콜백을 통해 캐시 무효화, 낙관적 업데이트 등을 처리할 수 있습니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>기본 사용법</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              mutationFn을 정의하고, onSuccess/onError 콜백으로 후속 처리를 수행합니다.
            </p>
            <CodeSnippet code={useMutationBasic} title="기본 사용 예시" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Mutation 콜백 패턴</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              onMutate, onSuccess, onError, onSettled 콜백이 순차적으로 실행됩니다.
              onMutate에서 반환한 context는 다른 콜백에서 사용할 수 있습니다.
            </p>
            <CodeSnippet code={mutationCallbacks} title="콜백 함수" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>mutate vs mutateAsync</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              mutate는 콜백 기반, mutateAsync는 Promise를 반환합니다.
              일반적으로 mutate를 권장하며, 순차 실행이 필요할 때 mutateAsync를 사용합니다.
            </p>
            <CodeSnippet code={mutateVsMutateAsync} title="mutate vs mutateAsync" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>관련 쿼리 무효화</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              invalidateQueries로 관련 쿼리를 무효화하여 자동으로 데이터를 갱신합니다.
            </p>
            <CodeSnippet code={invalidateQueries} title="쿼리 무효화" />
          </div>
        </div>
      ),
    },
    {
      key: 'caching',
      label: '캐싱 전략',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="React Query의 강력한 캐싱 메커니즘"
            description="staleTime과 gcTime을 이해하고 적절히 설정하면 불필요한 네트워크 요청을 줄일 수 있습니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>staleTime vs gcTime</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              staleTime은 데이터 신선도, gcTime은 캐시 보관 기간을 제어합니다.
            </p>
            <CodeSnippet code={staleTimeVsGcTime} title="staleTime vs gcTime" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>쿼리 무효화 및 리셋</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              invalidateQueries, resetQueries, removeQueries의 차이를 이해하고 상황에 맞게 사용합니다.
            </p>
            <CodeSnippet code={queryInvalidation} title="쿼리 무효화" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>쿼리 프리페칭</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              사용자가 필요로 하기 전에 미리 데이터를 로드하여 UX를 개선합니다.
            </p>
            <CodeSnippet code={prefetching} title="프리페칭 패턴" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>쿼리 데이터 직접 조작</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              setQueryData와 getQueryData로 캐시를 직접 읽고 쓸 수 있습니다.
              낙관적 업데이트에서 자주 사용됩니다.
            </p>
            <CodeSnippet code={manualCacheUpdate} title="캐시 직접 조작" />
          </div>
        </div>
      ),
    },
    {
      key: 'advanced',
      label: '고급 패턴',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="고급 사용 패턴"
            description="낙관적 업데이트, 무한 스크롤, 병렬/종속 쿼리, 쿼리 취소 등의 고급 기법을 학습합니다."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>낙관적 업데이트 (Optimistic Updates)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              서버 응답을 기다리지 않고 UI를 즉시 업데이트하여 빠른 사용자 경험을 제공합니다.
              실패 시 자동으로 이전 상태로 롤백합니다.
            </p>
            <CodeSnippet code={optimisticUpdate} title="낙관적 업데이트 전체 패턴" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>useInfiniteQuery (무한 스크롤)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              페이지네이션 데이터를 무한 스크롤 형태로 구현합니다.
              Intersection Observer와 함께 사용하면 자동 로딩 구현이 간단합니다.
            </p>
            <CodeSnippet code={infiniteQuery} title="무한 스크롤 구현" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>병렬 쿼리 및 종속 쿼리</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              여러 쿼리를 동시에 실행하거나, 이전 쿼리 결과에 따라 다음 쿼리를 실행합니다.
            </p>
            <CodeSnippet code={parallelDependentQueries} title="병렬/종속 쿼리" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>쿼리 취소 (AbortSignal)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              불필요한 네트워크 요청을 취소하여 리소스를 절약합니다.
              검색창이나 빠른 페이지 이동 시 유용합니다.
            </p>
            <CodeSnippet code={queryCancellation} title="쿼리 취소" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>React Query 가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          오프라인 참조용 TanStack React Query 튜토리얼
        </p>
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
