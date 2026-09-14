import { Tabs, Card, Alert } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

// Base configuration
const setupCode = `// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
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

const optionsExplanation = `// The main options
{
  staleTime: 5 * 60 * 1000,
  // How long the data stays "fresh"
  // Within this window nothing is re-fetched
  // Default: 0 (stale immediately)

  gcTime: 30 * 60 * 1000,
  // How long before the cache entry is released from memory
  // The cache survives this long after the component unmounts
  // Default: 5 minutes

  retry: 1,
  // How many times to retry on failure
  // Set it to false to disable retries

  refetchOnWindowFocus: false,
  // Whether to refetch when the window regains focus
  // Default: true
}`;

// Basic useQuery usage
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
      {isFetching && <Tag>Refreshing...</Tag>}
      <Button onClick={() => refetch()}>Refresh</Button>
      {data?.map(project => <div key={project.id}>{project.name}</div>)}
    </div>
  );
}`;

const queryKeyDesign = `// QueryKey design patterns

// 1. A single resource
['projects']
['users']

// 2. Resource + ID
['project', projectId]
['user', userId]

// 3. Resource + filters / parameters
['projects', { status: 'active', page: 1 }]
['tasks', { assignee: userId, completed: false }]

// 4. Nested relationships
['project', projectId, 'tasks']
['project', projectId, 'members']

// 5. Real-world examples
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

// Keys are arrays, so they are compared by deep equality
// Two filter objects with the same contents hit the same cache entry`;

const enabledOption = `// enabled: running a query conditionally

function TaskDetail({ taskId }: { taskId?: string }) {
  // Only run the query when taskId exists
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId!),
    enabled: !!taskId, // runs only when taskId is truthy
  });

  // Dependent query: fetch the task first, then its comments
  const { data: comments } = useQuery({
    queryKey: ['task', taskId, 'comments'],
    queryFn: () => fetchComments(taskId!),
    enabled: !!task, // runs only once the task data exists
  });

  return <div>{/* ... */}</div>;
}`;

const selectOption = `// select: transforming and memoizing the data

function ProjectMembers({ projectId }: { projectId: string }) {
  // Transform the server data before using it
  const { data: activeMembers } = useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => fetchProjectMembers(projectId),
    select: (data) => {
      // Keep only active members and sort them by name
      return data
        .filter(member => member.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  // select is memoized — it only re-runs when data changes
  return <div>{activeMembers?.map(/* ... */)}</div>;
}

// Computing statistics
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

  return <div>Done: {stats?.completed} / {stats?.total}</div>;
}`;

const placeholderInitialData = `// placeholderData vs initialData

// placeholderData: temporary data (never written to the cache)
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    placeholderData: {
      id: userId,
      name: 'Loading...',
      email: '',
    },
  });

  // The placeholder data shows while loading
  return <div>{user.name}</div>; // no isLoading check needed
}

// initialData: initial cache data (written to the cache)
function ProjectDetail({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    initialData: () => {
      // Pull the entry out of the existing project-list cache
      return queryClient
        .getQueryData<Project[]>(['projects'])
        ?.find(p => p.id === projectId);
    },
    // Even with initialData, a background refetch happens once staleTime passes
  });

  return <div>{project?.name}</div>;
}`;

// useMutation
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
      // On success, invalidate the project-list cache so it refreshes
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      message.success('Project created');
    },
    onError: (error) => {
      message.error(\`Creation failed: \${error.message}\`);
    },
    onSettled: () => {
      // Always runs, whether it succeeded or failed
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
        Create
      </Button>
    </Form>
  );
}`;

const mutationCallbacks = `// Mutation callback patterns

const updateTaskMutation = useMutation({
  mutationFn: (task: Task) => updateTask(task.id, task),

  // 1. onMutate: before the mutation runs (used for optimistic updates)
  onMutate: async (newTask) => {
    console.log('mutation started:', newTask);
    // Whatever you return becomes the context for the other callbacks
    return { timestamp: Date.now() };
  },

  // 2. onSuccess: on success
  onSuccess: (data, variables, context) => {
    console.log('success:', data);
    console.log('variables:', variables);
    console.log('Context:', context); // { timestamp: ... }
  },

  // 3. onError: on failure
  onError: (error, variables, context) => {
    console.error('failed:', error);
  },

  // 4. onSettled: always runs, success or failure
  onSettled: (data, error, variables, context) => {
    console.log('settled');
  },
});`;

const mutateVsMutateAsync = `// mutate vs mutateAsync

// mutate: callback based (recommended)
const mutation = useMutation({ mutationFn: createProject });

const handleCreate = (values: NewProject) => {
  mutation.mutate(values, {
    onSuccess: () => {
      message.success('Created');
      navigate('/projects');
    },
  });
};

// mutateAsync: returns a promise (needs try/catch)
const handleCreateAsync = async (values: NewProject) => {
  try {
    const result = await mutation.mutateAsync(values);
    message.success('Created');
    navigate(\`/projects/\${result.id}\`);
  } catch (error) {
    message.error('Creation failed');
  }
};

// mutateAsync is handy when several mutations must run in order
const handleBatch = async () => {
  try {
    const project = await createMutation.mutateAsync(projectData);
    const task = await createTaskMutation.mutateAsync({
      ...taskData,
      projectId: project.id,
    });
    message.success('Project and task created');
  } catch (error) {
    message.error('Creation failed');
  }
};`;

const invalidateQueries = `// Invalidating and refreshing related queries

const queryClient = useQueryClient();

// 1. Invalidate one key
queryClient.invalidateQueries({ queryKey: ['projects'] });

// 2. Invalidate one ID
queryClient.invalidateQueries({ queryKey: ['project', projectId] });

// 3. Invalidate many queries by prefix
queryClient.invalidateQueries({ queryKey: ['project', projectId] });
// → ['project', 'P001'], ['project', 'P001', 'tasks'],
//   invalidates ['project', 'P001', 'members'] too

// 4. In practice: refresh everything related after editing a task
const updateTaskMutation = useMutation({
  mutationFn: (task: Task) => updateTask(task.id, task),
  onSuccess: (_, variables) => {
    // the task detail
    queryClient.invalidateQueries({
      queryKey: ['task', variables.id],
    });
    // the project's task list
    queryClient.invalidateQueries({
      queryKey: ['project', variables.projectId, 'tasks'],
    });
    // the global task list
    queryClient.invalidateQueries({
      queryKey: ['tasks'],
    });
  },
});`;

// Caching strategy
const staleTimeVsGcTime = `// staleTime vs gcTime

/**
 * staleTime (freshness window)
 * - How long the data counts as "fresh"
 * - While fresh, the cache is used and no request is made
 * - Default: 0 (stale immediately)
 */

/**
 * gcTime (garbage collection time, formerly cacheTime)
 * - How long an unused cache entry stays in memory
 * - The cache survives this long after the component unmounts
 * - Default: 5 minutes
 */

// Scenario:
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes
});

/**
 * Timeline:
 *
 * 0s: the query runs and fetches -> fresh
 * 0–60s: fresh; remounting does not refetch
 * 60s: becomes stale
 * after 60s: stale; remounting triggers a background fetch
 * on unmount: the cache is kept (for gcTime)
 * 5 min after unmount: the cache is released
 *
 * On remount:
 * - within gcTime: the cache is used plus a background fetch
 * - after gcTime: no cache, a full fetch from scratch
 */`;

const queryInvalidation = `// Invalidating and resetting queries

const queryClient = useQueryClient();

// 1. invalidateQueries: marks entries stale and refreshes them
queryClient.invalidateQueries({ queryKey: ['projects'] });
// - mounted queries refetch immediately
// - unmounted queries refetch on their next mount

// 2. resetQueries: clears the cache and marks it stale
queryClient.resetQueries({ queryKey: ['projects'] });
// - reverts the cached data to initialData (or removes it if there is none)

// 3. removeQueries: removes the cache entirely
queryClient.removeQueries({ queryKey: ['projects'] });
// - deleted from memory outright

// 4. Filtered invalidation
queryClient.invalidateQueries({
  queryKey: ['projects'],
  exact: true, // exact matches only
});

queryClient.invalidateQueries({
  queryKey: ['projects'],
  refetchType: 'active', // active | inactive | all
});

// 5. Conditional invalidation with a predicate
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'project' &&
    query.queryKey[1] === projectId,
});`;

const prefetching = `// Prefetching queries

const queryClient = useQueryClient();

// 1. Basic prefetching
const handleMouseEnter = (projectId: string) => {
  // Load the data on hover, before it is needed
  queryClient.prefetchQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    staleTime: 60 * 1000, // stays fresh for a minute
  });
};

// 2. Prefetching the next page
function ProjectList({ page }: { page: number }) {
  const { data } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
  });

  // Load the next page as soon as the current one arrives
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

// 3. Prefetching before navigating
const navigate = useNavigate();

const handleNavigate = (projectId: string) => {
  // Load the data before the route changes
  queryClient.prefetchQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });
  navigate(\`/projects/\${projectId}\`);
};`;

const manualCacheUpdate = `// Reading and writing the cache directly

const queryClient = useQueryClient();

// 1. setQueryData: write the cache directly
const addProjectMutation = useMutation({
  mutationFn: createProject,
  onSuccess: (newProject) => {
    // Append the new project to the list without another request
    queryClient.setQueryData<Project[]>(
      ['projects'],
      (oldData) => [...(oldData || []), newProject]
    );
  },
});

// 2. getQueryData: read the cache
const projects = queryClient.getQueryData<Project[]>(['projects']);
console.log('cached projects:', projects);

// 3. The optimistic update pattern
const deleteProjectMutation = useMutation({
  mutationFn: deleteProject,
  onMutate: async (projectId) => {
    // Cancel any in-flight query
    await queryClient.cancelQueries({ queryKey: ['projects'] });

    // Snapshot the previous data
    const previous = queryClient.getQueryData(['projects']);

    // Update the cache optimistically
    queryClient.setQueryData<Project[]>(
      ['projects'],
      (old) => old?.filter(p => p.id !== projectId)
    );

    return { previous }; // used for the rollback
  },
  onError: (err, projectId, context) => {
    // Roll back to the previous data on failure
    if (context?.previous) {
      queryClient.setQueryData(['projects'], context.previous);
    }
  },
  onSettled: () => {
    // Either way, resync with the server
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});

// 4. Partial updates
queryClient.setQueryData<Project>(
  ['project', projectId],
  (oldData) => oldData ? { ...oldData, name: 'New Name' } : oldData
);`;

// Advanced patterns
const optimisticUpdate = `// The full optimistic update pattern

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

  // Step 1: before the mutation runs
  onMutate: async (updatedTask) => {
    // 1-1. Cancel any in-flight refetch so it cannot overwrite the optimistic update
    await queryClient.cancelQueries({
      queryKey: ['project', updatedTask.projectId, 'tasks'],
    });

    // 1-2. Snapshot the previous data for the rollback
    const previousTasks = queryClient.getQueryData<Task[]>([
      'project',
      updatedTask.projectId,
      'tasks',
    ]);

    // 1-3. Update the UI immediately
    queryClient.setQueryData<Task[]>(
      ['project', updatedTask.projectId, 'tasks'],
      (old) =>
        old?.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
    );

    // 1-4. Return the context the rollback needs
    return { previousTasks };
  },

  // Step 2: roll back on error
  onError: (err, updatedTask, context) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(
        ['project', updatedTask.projectId, 'tasks'],
        context.previousTasks
      );
    }
    message.error('Update failed');
  },

  // Step 3: resync with the server either way
  onSettled: (data, error, updatedTask) => {
    queryClient.invalidateQueries({
      queryKey: ['project', updatedTask.projectId, 'tasks'],
    });
  },
});

// Example: changing status by drag and drop
const handleDrop = (taskId: string, newStatus: Task['status']) => {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    updateTaskMutation.mutate({ ...task, status: newStatus });
    // The UI updates immediately (onMutate)
    // A server failure rolls it back automatically (onError)
  }
};`;

const infiniteQuery = `// useInfiniteQuery (infinite scrolling)

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
      // Return the parameter for the next page
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
  });

  // Automatic loading with an Intersection Observer
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

      {/* sentinel element */}
      <div ref={ref} style={{ height: 20 }}>
        {isFetchingNextPage && <Spin />}
      </div>

      {!hasNextPage && <div>Everything has been loaded</div>}
    </div>
  );
}

// Page-number based infinite scrolling
const infiniteQueryWithPage = useInfiniteQuery({
  queryKey: ['tasks', 'infinite'],
  queryFn: ({ pageParam = 1 }) => fetchTasks(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.hasNext ? allPages.length + 1 : undefined;
  },
});`;

const parallelDependentQueries = `// Parallel and dependent queries

// 1. Parallel queries: load several things at once
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

  // Check whether any query is still loading
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

// 2. useQueries: a dynamic number of parallel queries
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

// 3. Dependent queries: the next query uses the previous result
function UserProfile({ userId }: { userId: string }) {
  // Fetch the user first
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Then the user's department (after the user loads)
  const { data: department } = useQuery({
    queryKey: ['department', user?.departmentId],
    queryFn: () => fetchDepartment(user!.departmentId),
    enabled: !!user?.departmentId, // runs only once the user exists
  });

  // Then the department's projects (after the department loads)
  const { data: projects } = useQuery({
    queryKey: ['department', department?.id, 'projects'],
    queryFn: () => fetchDepartmentProjects(department!.id),
    enabled: !!department?.id,
  });

  return <div>{/* ... */}</div>;
}`;

const queryCancellation = `// Cancelling queries (AbortSignal)

// 1. Basic cancellation
const searchQuery = useQuery({
  queryKey: ['search', searchTerm],
  queryFn: async ({ signal }) => {
    // Pass the AbortSignal to fetch
    const response = await fetch(
      \`/api/search?q=\${searchTerm}\`,
      { signal } // cancelling the query aborts the fetch
    );
    return response.json();
  },
  enabled: searchTerm.length > 2,
});

// When searchTerm changes, the previous query is cancelled automatically

// 2. Using it with Axios
import axios from 'axios';

const axiosQuery = useQuery({
  queryKey: ['data'],
  queryFn: async ({ signal }) => {
    const { data } = await axios.get('/api/data', {
      signal, // Axios supports AbortSignal too
    });
    return data;
  },
});

// 3. Cancelling manually
const queryClient = useQueryClient();

const handleCancel = () => {
  queryClient.cancelQueries({ queryKey: ['search'] });
};

// 4. Automatic cancellation on unmount
useEffect(() => {
  return () => {
    // Cancel the in-flight query when unmounting
    queryClient.cancelQueries({ queryKey: ['longRunning'] });
  };
}, []);

// 5. Implementing a timeout
const queryWithTimeout = useQuery({
  queryKey: ['data'],
  queryFn: async ({ signal }) => {
    const timeoutId = setTimeout(() => {
      // Force-cancel after 5 seconds
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
      label: 'Basic setup',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="TanStack React Query is a powerful library for server state"
            description="Fetching, caching, synchronization and server-state updates, all handled declaratively."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>Configuring QueryClient and wrapping the provider</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Wrap the app root in QueryClientProvider and set the default options.
            </p>
            <CodeSnippet code={setupCode} title="main.tsx" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>The main options</h3>
            <CodeSnippet code={optionsExplanation} title="Option reference" />
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
            title="useQuery is the hook for reading data (GET)"
            description="Give it a queryKey and a queryFn and it handles caching, refetching and error handling for you."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>Basic usage</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              queryKey is the cache key and queryFn is the async function that fetches the data.
              You get back data, isLoading, isError, error, isFetching and refetch.
            </p>
            <CodeSnippet code={useQueryBasic} title="Basic usage" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Designing query keys</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              A queryKey is an array and can carry the resource, an ID, filters and so on.
              A different key means a different cache entry.
            </p>
            <CodeSnippet code={queryKeyDesign} title="QueryKey patterns" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>The enabled option (conditional queries)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              enabled runs the query only when a condition holds.
              It is what makes dependent queries possible.
            </p>
            <CodeSnippet code={enabledOption} title="The enabled option" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>The select option (transforming data)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              select transforms or filters the query result.
              The transformation is memoized, so it does not recompute needlessly.
            </p>
            <CodeSnippet code={selectOption} title="The select option" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>placeholderData vs initialData</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              placeholderData is shown while loading; initialData is written into the cache.
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
            title="useMutation is the hook for creating, updating and deleting (POST/PUT/DELETE)"
            description="Its success and error callbacks are where cache invalidation and optimistic updates happen."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>Basic usage</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Define a mutationFn and handle the aftermath in the onSuccess / onError callbacks.
            </p>
            <CodeSnippet code={useMutationBasic} title="Basic usage" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Mutation callback patterns</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              onMutate, onSuccess, onError and onSettled fire in that order.
              The context returned from onMutate is available to the others.
            </p>
            <CodeSnippet code={mutationCallbacks} title="The callbacks" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>mutate vs mutateAsync</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              mutate is callback based; mutateAsync returns a promise.
              Prefer mutate in general, and reach for mutateAsync when things must run in sequence.
            </p>
            <CodeSnippet code={mutateVsMutateAsync} title="mutate vs mutateAsync" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Invalidating related queries</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              invalidateQueries marks related queries stale so they refresh themselves.
            </p>
            <CodeSnippet code={invalidateQueries} title="Query invalidation" />
          </div>
        </div>
      ),
    },
    {
      key: 'caching',
      label: 'Caching strategy',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="React Query's caching mechanism"
            description="Understand staleTime and gcTime, set them well, and most redundant network requests disappear."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>staleTime vs gcTime</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              staleTime controls freshness; gcTime controls how long the cache is kept.
            </p>
            <CodeSnippet code={staleTimeVsGcTime} title="staleTime vs gcTime" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Invalidating and resetting queries</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Know the difference between invalidateQueries, resetQueries and removeQueries, and pick the right one.
            </p>
            <CodeSnippet code={queryInvalidation} title="Query invalidation" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Prefetching</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Load data before the user asks for it and the experience feels instant.
            </p>
            <CodeSnippet code={prefetching} title="Prefetching patterns" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Working with cached data directly</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              setQueryData and getQueryData read and write the cache directly.
              They are the backbone of optimistic updates.
            </p>
            <CodeSnippet code={manualCacheUpdate} title="Direct cache manipulation" />
          </div>
        </div>
      ),
    },
    {
      key: 'advanced',
      label: 'Advanced patterns',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            title="Advanced usage patterns"
            description="Optimistic updates, infinite scrolling, parallel and dependent queries, and query cancellation."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div className="demo-section">
            <h3>Optimistic updates</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Update the UI right away instead of waiting for the server, and the app feels fast.
              On failure it rolls back to the previous state automatically.
            </p>
            <CodeSnippet code={optimisticUpdate} title="The full optimistic update pattern" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>useInfiniteQuery (infinite scrolling)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Turns paginated data into an infinite scroll.
              Paired with an Intersection Observer, automatic loading is only a few lines.
            </p>
            <CodeSnippet code={infiniteQuery} title="Implementing infinite scroll" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Parallel and dependent queries</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Run several queries at once, or chain one query onto the result of another.
            </p>
            <CodeSnippet code={parallelDependentQueries} title="Parallel and dependent queries" />
          </div>

          <div className="demo-section" style={{ marginTop: 32 }}>
            <h3>Cancelling queries (AbortSignal)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Cancel requests nobody is waiting for and save the resources.
              Especially useful for search boxes and rapid navigation.
            </p>
            <CodeSnippet code={queryCancellation} title="Query cancellation" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideReactQuery" />
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
