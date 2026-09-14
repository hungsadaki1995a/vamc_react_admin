import { Tabs, Card, Button, Space } from 'antd';
import { create } from 'zustand';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

// Live demo store
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Code snippets
const basicStoreCode = `import { create } from 'zustand';

interface BearStore {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// Using it in a component
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}`;

const selectorCode = `// Inefficient: subscribing to the whole state (causes unnecessary re-renders)
const state = useBearStore();

// Efficient: select only the state you need
const bears = useBearStore((state) => state.bears);
const increasePopulation = useBearStore((state) => state.increasePopulation);

// Selecting several values (shallow comparison via useShallow)
import { useShallow } from 'zustand/react/shallow';

const { bears, increasePopulation } = useBearStore(
  useShallow((state) => ({
    bears: state.bears,
    increasePopulation: state.increasePopulation,
  }))
);`;

const actionsCode = `const useStore = create<Store>((set, get) => ({
  count: 0,

  // Basic actions
  increment: () => set((state) => ({ count: state.count + 1 })),

  // Updating several pieces of state
  reset: () => set({ count: 0, lastReset: Date.now() }),

  // Reading the current state with get()
  incrementIfOdd: () => {
    const { count } = get();
    if (count % 2 === 1) {
      set({ count: count + 1 });
    }
  },

  // Async actions
  fetchData: async () => {
    set({ loading: true });
    const data = await api.fetch();
    set({ data, loading: false });
  },
}));`;

const liveCounterCode = `import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);
  const reset = useCounterStore((state) => state.reset);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`;

const persistMiddlewareCode = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TabStore {
  tabs: Tab[];
  activeTabKey: string;
  openTab: (tab: Tab) => void;
  closeTab: (key: string) => void;
}

const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabKey: '',

      openTab: (tab) => {
        const { tabs } = get();
        if (!tabs.find((t) => t.key === tab.key)) {
          set({ tabs: [...tabs, tab], activeTabKey: tab.key });
        } else {
          set({ activeTabKey: tab.key });
        }
      },

      closeTab: (key) => {
        const { tabs, activeTabKey } = get();
        const newTabs = tabs.filter((t) => t.key !== key);
        set({
          tabs: newTabs,
          activeTabKey: activeTabKey === key ? newTabs[0]?.key : activeTabKey,
        });
      },
    }),
    {
      name: 'vamc-tabs', // localStorage key
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabKey: state.activeTabKey,
      }),
    }
  )
);`;

const immerMiddlewareCode = `import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
}

const useTodoStore = create<TodoStore>()(
  immer((set) => ({
    todos: [],

    addTodo: (text) =>
      set((state) => {
        // With Immer you can mutate directly without worrying about immutability
        state.todos.push({
          id: Math.random().toString(),
          text,
          completed: false,
        });
      }),

    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
        }
      }),
  }))
);`;

const devtoolsCode = `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create<Store>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    { name: 'CounterStore' } // name shown in Redux DevTools
  )
);`;

const combinedMiddlewareCode = `import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Middleware composition order: devtools > persist > immer
const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        // store implementation
      })),
      { name: 'storage-key' }
    ),
    { name: 'StoreName' }
  )
);`;

const domainSeparationCode = `// Bad: everything in a single store
const useAppStore = create((set) => ({
  user: null,
  tabs: [],
  theme: 'light',
  projects: [],
}));

// Good: one store per domain
const useUserStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

const useTabStore = create((set) => ({
  tabs: [],
  openTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  closeTab: (key) => set((state) => ({
    tabs: state.tabs.filter((t) => t.key !== key)
  })),
}));`;

const crossStoreCode = `// Referencing one store from another
const useProjectStore = create<ProjectStore>((set, get) => ({
  selectedProject: null,

  selectProject: (project) => {
    set({ selectedProject: project });

    // Calling an action on another store
    useTabStore.getState().openTab({
      key: 'project-detail',
      title: project.name,
    });
  },
}));

// Reactive pattern using subscribe
useProjectStore.subscribe(
  (state) => state.selectedProject,
  (selectedProject) => {
    if (selectedProject) {
      console.log('Project selected:', selectedProject);
    }
  }
);`;

const projectStoresCode = `// Store layout of the VAMC NPL ADMIN project

1. tabStore (src/stores/tabStore.ts)
   - open / close / pin / unpin / reorder tabs
   - persisted to localStorage via the persist middleware
   - limited to 20 tabs

2. menuStore (src/stores/menuStore.ts)
   - active icon rail entry (activeRailKey)
   - flyout panel visibility (flyoutVisible)
   - expanded menu state (openKeys)

3. themeStore (src/stores/themeStore.ts)
   - dark / light theme toggle
   - user preference stored via persist
   - wired to the Ant Design algorithm

4. projectStore (src/stores/projectStore.ts)
   - the selected project
   - last selection kept via persist`;

const asyncActionCode = `interface DataStore {
  data: any[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

const useDataStore = create<DataStore>((set) => ({
  data: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// Using it in a component
function DataList() {
  const { data, loading, error, fetchData } = useDataStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Spin />;
  if (error) return <Alert title={error} type="error" />;

  return <List dataSource={data} />;
}`;

const tabStoreCode = `// src/stores/tabStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  key: string;
  title: string;
  menuKey: string;
  componentPath: string;
  closable: boolean;
  pinned: boolean;
}

interface TabStore {
  tabs: Tab[];
  activeTabKey: string;
  openTab: (tab: Omit<Tab, 'pinned'>) => void;
  closeTab: (key: string) => void;
  setActiveTab: (key: string) => void;
  pinTab: (key: string) => void;
  unpinTab: (key: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabKey: '',

      openTab: (tab) => {
        const { tabs } = get();
        const existing = tabs.find((t) => t.key === tab.key);

        if (existing) {
          set({ activeTabKey: tab.key });
        } else {
          if (tabs.length >= 20) return;
          set({
            tabs: [...tabs, { ...tab, pinned: false }],
            activeTabKey: tab.key,
          });
        }
      },

      closeTab: (key) => {
        const { tabs, activeTabKey } = get();
        const newTabs = tabs.filter((t) => t.key !== key);
        let newActiveKey = activeTabKey;
        if (activeTabKey === key && newTabs.length > 0) {
          const closedIndex = tabs.findIndex((t) => t.key === key);
          newActiveKey = newTabs[Math.min(closedIndex, newTabs.length - 1)].key;
        }
        set({ tabs: newTabs, activeTabKey: newActiveKey });
      },

      setActiveTab: (key) => set({ activeTabKey: key }),

      pinTab: (key) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.key === key ? { ...t, pinned: true } : t)),
        })),

      unpinTab: (key) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.key === key ? { ...t, pinned: false } : t)),
        })),

      reorderTabs: (fromIndex, toIndex) => {
        const { tabs } = get();
        const newTabs = [...tabs];
        const [removed] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, removed);
        set({ tabs: newTabs });
      },
    }),
    {
      name: 'vamc-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabKey: state.activeTabKey,
      }),
    }
  )
);`;

// Live demo component
function LiveCounterDemo() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);
  const reset = useCounterStore((state) => state.reset);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: '16px 0', color: 'var(--primary-color)' }}>
          {count}
        </h1>
        <Space size="middle">
          <Button onClick={decrement} size="large">-1</Button>
          <Button onClick={reset} size="large">Reset</Button>
          <Button onClick={increment} type="primary" size="large">+1</Button>
        </Space>
      </div>
    </Card>
  );
}

export default function GuideZustand() {
  const tabItems = [
    {
      key: 'basic',
      label: 'Basics',
      children: (
        <div>
          <div className="demo-section">
            <h3>Creating a store</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Create a store with the <code>create()</code> function. With TypeScript you get full type safety.
            </p>
            <CodeSnippet code={basicStoreCode} title="Creating a basic store" />
          </div>

          <div className="demo-section">
            <h3>Selector pattern</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Select only the state you need to avoid unnecessary re-renders.
            </p>
            <CodeSnippet code={selectorCode} title="Using selectors efficiently" />
          </div>

          <div className="demo-section">
            <h3>Defining actions</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Use the <code>set</code> and <code>get</code> functions to define actions that update state.
            </p>
            <CodeSnippet code={actionsCode} title="Assorted action patterns" />
          </div>

          <div className="demo-section">
            <h3>Live demo: counter</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              A working Zustand store. Try clicking the buttons.
            </p>
            <LiveCounterDemo />
            <CodeSnippet code={liveCounterCode} title="Counter implementation" />
          </div>
        </div>
      ),
    },
    {
      key: 'middleware',
      label: 'Middleware',
      children: (
        <div>
          <div className="demo-section">
            <h3>Persist middleware</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Automatically saves state to localStorage or sessionStorage and restores it.
            </p>
            <CodeSnippet code={persistMiddlewareCode} title="Using the persist middleware" />
          </div>

          <div className="demo-section">
            <h3>Immer middleware</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Update deeply nested state as if you were mutating it, without handling immutability yourself.
            </p>
            <CodeSnippet code={immerMiddlewareCode} title="Using the immer middleware" />
          </div>

          <div className="demo-section">
            <h3>Devtools middleware</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Hooks into Redux DevTools so you can visualize and debug state changes.
            </p>
            <CodeSnippet code={devtoolsCode} title="Devtools middleware" />
          </div>

          <div className="demo-section">
            <h3>Composing middleware</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Several middlewares can be combined. Composition order: devtools → persist → immer.
            </p>
            <CodeSnippet code={combinedMiddlewareCode} title="Composing middleware" />
          </div>
        </div>
      ),
    },
    {
      key: 'patterns',
      label: 'Store design patterns',
      children: (
        <div>
          <div className="demo-section">
            <h3>One store per domain</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Several small domain stores are easier to maintain than one large store.
            </p>
            <CodeSnippet code={domainSeparationCode} title="Domain separation" />
          </div>

          <div className="demo-section">
            <h3>Referencing other stores</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              A store can read another store's state or call its actions.
            </p>
            <CodeSnippet code={crossStoreCode} title="Store-to-store communication" />
          </div>

          <div className="demo-section">
            <h3>Store layout in VAMC NPL ADMIN</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              This project is organized into four domain stores.
            </p>
            <Card size="small">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                {projectStoresCode}
              </pre>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'react',
      label: 'React integration',
      children: (
        <div>
          <div className="demo-section">
            <h3>Handling async actions</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Handle async work (API calls and the like) inside the action and track loading / error state alongside it.
            </p>
            <CodeSnippet code={asyncActionCode} title="Async actions" />
          </div>
        </div>
      ),
    },
    {
      key: 'examples',
      label: 'Real project examples',
      children: (
        <div>
          <div className="demo-section">
            <h3>tabStore — tab management</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Opening, closing, pinning and reordering tabs is all managed in Zustand.
            </p>
            <CodeSnippet code={tabStoreCode} title="src/stores/tabStore.ts" />
          </div>

          <Card
            size="small"
            style={{
              marginTop: 24,
              background: 'var(--primary-color-bg)',
              borderColor: 'var(--primary-color-border)',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Key patterns at a glance</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              <li><strong>Persist</strong>: user settings (theme, tabs) are stored with persist</li>
              <li><strong>Domain separation</strong>: tabs, menu, theme and project each get their own store</li>
              <li><strong>Selector optimization</strong>: select only what you need to minimize re-renders</li>
              <li><strong>Type safety</strong>: TypeScript interfaces keep state management safe</li>
            </ul>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideZustand" />
      <Tabs items={tabItems} />
    </div>
  );
}
