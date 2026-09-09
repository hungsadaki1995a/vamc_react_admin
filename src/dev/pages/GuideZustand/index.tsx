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

// 컴포넌트에서 사용
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}`;

const selectorCode = `// ❌ 비효율적: 전체 상태를 구독 (불필요한 리렌더 발생)
const state = useBearStore();

// ✅ 효율적: 필요한 상태만 선택
const bears = useBearStore((state) => state.bears);
const increasePopulation = useBearStore((state) => state.increasePopulation);

// ✅ 여러 값 선택 (useShallow로 shallow comparison)
import { useShallow } from 'zustand/react/shallow';

const { bears, increasePopulation } = useBearStore(
  useShallow((state) => ({
    bears: state.bears,
    increasePopulation: state.increasePopulation,
  }))
);`;

const actionsCode = `const useStore = create<Store>((set, get) => ({
  count: 0,

  // 기본 액션
  increment: () => set((state) => ({ count: state.count + 1 })),

  // 여러 상태 업데이트
  reset: () => set({ count: 0, lastReset: Date.now() }),

  // get()으로 현재 상태 접근
  incrementIfOdd: () => {
    const { count } = get();
    if (count % 2 === 1) {
      set({ count: count + 1 });
    }
  },

  // 비동기 액션
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
        // Immer를 사용하면 불변성을 신경쓰지 않고 직접 수정 가능
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
    { name: 'CounterStore' } // Redux DevTools에 표시될 이름
  )
);`;

const combinedMiddlewareCode = `import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 미들웨어 조합 순서: devtools > persist > immer
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

const domainSeparationCode = `// ❌ 나쁜 예: 모든 것을 하나의 스토어에
const useAppStore = create((set) => ({
  user: null,
  tabs: [],
  theme: 'light',
  projects: [],
}));

// ✅ 좋은 예: 도메인별 스토어 분리
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

const crossStoreCode = `// 스토어 간 참조 패턴
const useProjectStore = create<ProjectStore>((set, get) => ({
  selectedProject: null,

  selectProject: (project) => {
    set({ selectedProject: project });

    // 다른 스토어의 액션 호출
    useTabStore.getState().openTab({
      key: 'project-detail',
      title: project.name,
    });
  },
}));

// subscribe를 사용한 반응형 패턴
useProjectStore.subscribe(
  (state) => state.selectedProject,
  (selectedProject) => {
    if (selectedProject) {
      console.log('Project selected:', selectedProject);
    }
  }
);`;

const projectStoresCode = `// VAMC NPL ADMIN 프로젝트의 스토어 구조

1. tabStore (src/stores/tabStore.ts)
   - 탭 열기/닫기/핀/언핀/재정렬
   - persist 미들웨어로 localStorage 영속화
   - 최대 20개 탭 제한

2. menuStore (src/stores/menuStore.ts)
   - Icon Rail 활성 상태 (activeRailKey)
   - Flyout Panel 표시/숨김 (flyoutVisible)
   - 메뉴 펼침 상태 (openKeys)

3. themeStore (src/stores/themeStore.ts)
   - 다크/라이트 테마 토글
   - persist로 사용자 선호도 저장
   - Ant Design algorithm 연동

4. projectStore (src/stores/projectStore.ts)
   - 선택된 프로젝트 상태
   - persist로 마지막 선택 유지`;

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

// 컴포넌트에서 사용
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
      label: '기본 사용법',
      children: (
        <div>
          <div className="demo-section">
            <h3>Store 생성</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              <code>create()</code> 함수로 스토어를 생성합니다. TypeScript를 사용하면 타입 안정성을 확보할 수 있습니다.
            </p>
            <CodeSnippet code={basicStoreCode} title="기본 스토어 생성" />
          </div>

          <div className="demo-section">
            <h3>Selector 패턴</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              필요한 상태만 선택하여 불필요한 리렌더를 방지합니다.
            </p>
            <CodeSnippet code={selectorCode} title="효율적인 Selector 사용" />
          </div>

          <div className="demo-section">
            <h3>Actions 정의</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              <code>set</code>과 <code>get</code> 함수를 사용하여 상태를 업데이트하는 액션을 정의합니다.
            </p>
            <CodeSnippet code={actionsCode} title="다양한 액션 패턴" />
          </div>

          <div className="demo-section">
            <h3>라이브 데모: 카운터</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              실제로 동작하는 Zustand 스토어 예제입니다. 버튼을 클릭해보세요.
            </p>
            <LiveCounterDemo />
            <CodeSnippet code={liveCounterCode} title="카운터 구현 코드" />
          </div>
        </div>
      ),
    },
    {
      key: 'middleware',
      label: '미들웨어',
      children: (
        <div>
          <div className="demo-section">
            <h3>Persist 미들웨어</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              localStorage 또는 sessionStorage에 상태를 자동으로 저장하고 복원합니다.
            </p>
            <CodeSnippet code={persistMiddlewareCode} title="Persist 미들웨어 사용" />
          </div>

          <div className="demo-section">
            <h3>Immer 미들웨어</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              복잡한 중첩 상태를 불변성을 신경쓰지 않고 직접 수정하는 것처럼 업데이트할 수 있습니다.
            </p>
            <CodeSnippet code={immerMiddlewareCode} title="Immer 미들웨어 사용" />
          </div>

          <div className="demo-section">
            <h3>Devtools 미들웨어</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Redux DevTools와 연동하여 상태 변화를 시각화하고 디버깅할 수 있습니다.
            </p>
            <CodeSnippet code={devtoolsCode} title="Devtools 미들웨어" />
          </div>

          <div className="demo-section">
            <h3>미들웨어 조합</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              여러 미들웨어를 함께 사용할 수 있습니다. 조합 순서: devtools → persist → immer.
            </p>
            <CodeSnippet code={combinedMiddlewareCode} title="미들웨어 조합" />
          </div>
        </div>
      ),
    },
    {
      key: 'patterns',
      label: '스토어 설계 패턴',
      children: (
        <div>
          <div className="demo-section">
            <h3>도메인별 스토어 분리</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              하나의 거대한 스토어보다 도메인별로 분리된 작은 스토어들이 유지보수에 유리합니다.
            </p>
            <CodeSnippet code={domainSeparationCode} title="도메인 분리 원칙" />
          </div>

          <div className="demo-section">
            <h3>스토어 간 참조</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              스토어는 다른 스토어의 상태를 읽거나 액션을 호출할 수 있습니다.
            </p>
            <CodeSnippet code={crossStoreCode} title="스토어 간 통신" />
          </div>

          <div className="demo-section">
            <h3>VAMC NPL ADMIN 프로젝트 스토어 구조</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              본 프로젝트는 4개의 도메인별 스토어로 구성되어 있습니다.
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
      label: 'React 연동',
      children: (
        <div>
          <div className="demo-section">
            <h3>비동기 액션 처리</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              비동기 작업(API 호출 등)은 액션 함수 내에서 처리하고, loading/error 상태를 함께 관리합니다.
            </p>
            <CodeSnippet code={asyncActionCode} title="비동기 액션" />
          </div>
        </div>
      ),
    },
    {
      key: 'examples',
      label: '프로젝트 실전 예시',
      children: (
        <div>
          <div className="demo-section">
            <h3>tabStore - 탭 관리</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              탭 열기/닫기/핀/재정렬 등의 복잡한 로직을 Zustand로 관리합니다.
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
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>핵심 패턴 요약</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              <li><strong>Persist</strong>: 사용자 설정(theme, tabs)은 persist로 저장</li>
              <li><strong>도메인 분리</strong>: 탭/메뉴/테마/프로젝트 각각 독립된 스토어</li>
              <li><strong>Selector 최적화</strong>: 필요한 상태만 선택하여 리렌더 최소화</li>
              <li><strong>타입 안정성</strong>: TypeScript 인터페이스로 안전한 상태 관리</li>
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
