import { Tabs, Card } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';

// ============================================================
// 기본 라우팅 예제 코드
// ============================================================

const basicRouterCode = `import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}`;

const loaderActionCode = `import { useLoaderData, Form } from 'react-router-dom';

// 라우트 설정
const router = createBrowserRouter([
  {
    path: '/users/:userId',
    element: <UserDetailPage />,
    loader: async ({ params }) => {
      const response = await fetch(\`/api/users/\${params.userId}\`);
      return response.json();
    },
    action: async ({ request, params }) => {
      const formData = await request.formData();
      const response = await fetch(\`/api/users/\${params.userId}\`, {
        method: 'PUT',
        body: formData,
      });
      return response.json();
    },
  },
]);

// 컴포넌트에서 사용
function UserDetailPage() {
  const user = useLoaderData();

  return (
    <div>
      <h1>{user.name}</h1>
      <Form method="post">
        <input name="name" defaultValue={user.name} />
        <button type="submit">저장</button>
      </Form>
    </div>
  );
}`;

const errorElementCode = `import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data?.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>알 수 없는 오류가 발생했습니다</h1>
      <p>{error?.message}</p>
    </div>
  );
}`;

// ============================================================
// 중첩 라우트 예제 코드
// ============================================================

const nestedRouteCode = `import { Outlet } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true, // index route: 부모와 같은 경로
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductsLayout />,
        children: [
          {
            index: true,
            element: <ProductListPage />,
          },
          {
            path: ':productId',
            element: <ProductDetailPage />,
          },
          {
            path: ':productId/edit',
            element: <ProductEditPage />,
          },
        ],
      },
    ],
  },
]);

// 레이아웃 컴포넌트
function RootLayout() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
        </nav>
      </header>
      <main>
        <Outlet /> {/* 자식 라우트가 렌더링되는 위치 */}
      </main>
      <footer>Footer</footer>
    </div>
  );
}`;

const useParamsCode = `import { useParams } from 'react-router-dom';

function ProductDetailPage() {
  const { productId } = useParams();

  return (
    <div>
      <h1>제품 상세 - ID: {productId}</h1>
    </div>
  );
}

// URL이 /products/123 이면
// productId = "123"`;

const outletContextCode = `import { Outlet, useOutletContext } from 'react-router-dom';

interface LayoutContext {
  user: User;
  theme: 'light' | 'dark';
}

function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div>
      <Outlet context={{ user, theme } satisfies LayoutContext} />
    </div>
  );
}

// 자식 컴포넌트에서
function ChildPage() {
  const { user, theme } = useOutletContext<LayoutContext>();

  return <div>현재 테마: {theme}</div>;
}`;

// ============================================================
// 네비게이션 예제 코드
// ============================================================

const useNavigateCode = `import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    await loginAPI(credentials);

    // 프로그래매틱 네비게이션
    navigate('/dashboard');

    // 뒤로가기와 같은 효과
    navigate(-1);

    // 히스토리 스택 교체 (뒤로가기 방지)
    navigate('/dashboard', { replace: true });

    // state와 함께 이동
    navigate('/profile', {
      state: { from: 'login', message: '환영합니다!' }
    });
  };

  return (
    <form onSubmit={handleLogin}>
      <button type="submit">로그인</button>
    </form>
  );
}`;

const linkCode = `import { Link, NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      {/* 기본 Link */}
      <Link to="/about">소개</Link>
      <Link to="/products/123">제품 123</Link>

      {/* 상대 경로 */}
      <Link to="..">부모로</Link>
      <Link to="../sibling">형제로</Link>

      {/* state 전달 */}
      <Link to="/profile" state={{ from: 'nav' }}>
        프로필
      </Link>

      {/* NavLink: 활성 링크 스타일링 */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          isActive ? 'nav-link active' : 'nav-link'
        }
        style={({ isActive }) => ({
          color: isActive ? 'red' : 'black',
        })}
      >
        대시보드
      </NavLink>
    </nav>
  );
}`;

const navigateComponentCode = `import { Navigate } from 'react-router-dom';

function ProtectedPage() {
  const { isAuthenticated } = useAuth();

  // 로그인하지 않은 경우 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div>보호된 페이지</div>;
}`;

const useLocationCode = `import { useLocation, useNavigate } from 'react-router-dom';

function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.pathname: 현재 경로
  // location.search: 쿼리 스트링 (?key=value)
  // location.hash: 해시 (#section)
  // location.state: navigate로 전달된 state

  useEffect(() => {
    if (location.state?.message) {
      message.success(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  return (
    <div>
      <p>현재 경로: {location.pathname}</p>
      <p>쿼리: {location.search}</p>
    </div>
  );
}`;

// ============================================================
// URL 파라미터 예제 코드
// ============================================================

const dynamicParamsCode = `import { useParams } from 'react-router-dom';

// 라우트 설정
const router = createBrowserRouter([
  {
    path: '/projects/:projectId/tasks/:taskId',
    element: <TaskDetailPage />,
  },
  {
    path: '/users/:userId?', // Optional 파라미터
    element: <UserPage />,
  },
]);

// 컴포넌트
function TaskDetailPage() {
  const { projectId, taskId } = useParams();

  return (
    <div>
      <h1>프로젝트 {projectId}</h1>
      <h2>업무 {taskId}</h2>
    </div>
  );
}`;

const searchParamsCode = `import { useSearchParams } from 'react-router-dom';

function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL: /products?category=electronics&sort=price&page=2
  const category = searchParams.get('category'); // "electronics"
  const sort = searchParams.get('sort'); // "price"
  const page = searchParams.get('page'); // "2"

  const handleFilterChange = (newCategory: string) => {
    setSearchParams({
      category: newCategory,
      sort: sort || 'name',
      page: '1',
    });
  };

  return (
    <div>
      <button onClick={() => handleFilterChange('electronics')}>
        전자제품
      </button>
    </div>
  );
}`;

// ============================================================
// 본 프로젝트 패턴 예제 코드
// ============================================================

const projectRouterCode = `// src/main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';

// 최소한의 라우터 설정: 단일 라우트만 사용
const router = createBrowserRouter([
  {
    path: '/app/:tabKey?',
    element: <RootLayout />,
  },
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
]);

// React Router는 오직 브라우저 히스토리 동기화만 담당
// 실제 네비게이션은 탭 시스템이 처리
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);`;

const tabRouteSyncCode = `// src/hooks/useTabRouteSync.ts
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';

/**
 * 탭 ↔ URL 양방향 동기화 훅
 *
 * 1. 탭 변경 → URL 업데이트 (pushState)
 * 2. 브라우저 뒤로/앞으로 → 탭 활성화 (popstate)
 * 3. 활성 탭의 메뉴 경로 → IconRail 아이콘 하이라이트
 */
export function useTabRouteSync() {
  const navigate = useNavigate();
  const { tabKey: urlTabKey } = useParams();
  const { activeTabKey, tabs, setActiveTab } = useTabStore();
  const { setActiveRailKey } = useMenuStore();

  // 탭 변경 → URL 업데이트
  useEffect(() => {
    if (activeTabKey && \`/app/\${activeTabKey}\` !== window.location.pathname) {
      navigate(\`/app/\${activeTabKey}\`, { replace: false });
    }
  }, [activeTabKey, navigate]);

  // URL 변경 → 탭 활성화 (브라우저 뒤로/앞으로)
  useEffect(() => {
    if (urlTabKey && urlTabKey !== activeTabKey) {
      const targetTab = tabs.find((t) => t.key === urlTabKey);
      if (targetTab) {
        setActiveTab(urlTabKey);
      }
    }
  }, [urlTabKey, activeTabKey, tabs, setActiveTab]);
}`;

const whyMinimalRoutingCode = `/**
 * 본 프로젝트에서 React Router를 최소로 사용하는 이유
 *
 * 1. 탭 시스템이 주 네비게이션
 *    - 모든 페이지는 탭으로 열림
 *    - 동시에 여러 탭 오픈, 상태 유지 (display:none 토글)
 *
 * 2. React Router는 단일 활성 경로만 지원
 *    - 여러 탭을 동시에 마운트 유지할 수 없음
 *    - 매번 컴포넌트 언마운트/재마운트 → 상태 손실
 *
 * 3. URL은 브라우저 히스토리용으로만 활용
 *    - 뒤로/앞으로 버튼으로 이전 탭 복원
 *    - 새로고침 시 활성 탭 복원
 */

// TabContent.tsx 핵심 로직
function TabContent() {
  const { tabs, activeTabKey } = useTabStore();

  return (
    <div className="tab-content">
      {tabs.map((tab) => {
        const Component = componentRegistry[tab.componentPath];

        return (
          <div
            key={tab.key}
            className="tab-pane"
            style={{
              display: tab.key === activeTabKey ? 'block' : 'none'
            }}
          >
            {Component ? <Component /> : <div>컴포넌트 없음</div>}
          </div>
        );
      })}
    </div>
  );
}`;

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function GuideReactRouter() {
  const items = [
    {
      key: 'basic',
      label: '기본 라우팅',
      children: (
        <div>
          <div className="demo-section">
            <h3>createBrowserRouter 설정</h3>
            <p>
              React Router v7은 데이터 라우터 API를 사용합니다.{' '}
              <code>createBrowserRouter</code>로 라우트를 정의하고{' '}
              <code>RouterProvider</code>로 앱을 감쌉니다.
            </p>
            <CodeSnippet code={basicRouterCode} title="기본 라우터 설정" />
          </div>

          <div className="demo-section">
            <h3>Loader와 Action</h3>
            <p>
              <code>loader</code>는 라우트 진입 전 데이터를 로드하고,{' '}
              <code>action</code>은 폼 제출 등의 변경 작업을 처리합니다.
            </p>
            <CodeSnippet code={loaderActionCode} title="Loader와 Action 사용" />
          </div>

          <div className="demo-section">
            <h3>Error Element</h3>
            <p>
              <code>errorElement</code>는 라우트에서 발생한 에러를 처리합니다.
            </p>
            <CodeSnippet code={errorElementCode} title="에러 처리" />
          </div>
        </div>
      ),
    },
    {
      key: 'nested',
      label: '중첩 라우트',
      children: (
        <div>
          <div className="demo-section">
            <h3>Outlet과 레이아웃 라우트</h3>
            <p>
              중첩 라우트를 사용하면 레이아웃을 공유하면서 페이지 일부만 교체할 수 있습니다.{' '}
              부모 라우트는 <code>Outlet</code> 컴포넌트를 렌더합니다.
            </p>
            <CodeSnippet code={nestedRouteCode} title="중첩 라우트와 Outlet" />
          </div>

          <div className="demo-section">
            <h3>useParams로 동적 세그먼트 읽기</h3>
            <p>URL 경로의 동적 세그먼트는 <code>useParams</code> 훅으로 접근합니다.</p>
            <CodeSnippet code={useParamsCode} title="useParams 사용" />
          </div>

          <div className="demo-section">
            <h3>Outlet Context</h3>
            <p>부모 레이아웃에서 자식으로 데이터를 전달할 때 <code>Outlet context</code>를 사용할 수 있습니다.</p>
            <CodeSnippet code={outletContextCode} title="Outlet Context" />
          </div>
        </div>
      ),
    },
    {
      key: 'navigation',
      label: '네비게이션',
      children: (
        <div>
          <div className="demo-section">
            <h3>useNavigate 훅</h3>
            <p>프로그래매틱 네비게이션은 <code>useNavigate</code> 훅을 사용합니다.</p>
            <CodeSnippet code={useNavigateCode} title="useNavigate 사용" />
          </div>

          <div className="demo-section">
            <h3>Link와 NavLink</h3>
            <p>선언적 네비게이션은 <code>Link</code> 또는 <code>NavLink</code> 컴포넌트를 사용합니다.</p>
            <CodeSnippet code={linkCode} title="Link와 NavLink" />
          </div>

          <div className="demo-section">
            <h3>Navigate 컴포넌트</h3>
            <p>조건부 렌더링으로 리다이렉트할 때 <code>Navigate</code> 컴포넌트를 사용합니다.</p>
            <CodeSnippet code={navigateComponentCode} title="Navigate 컴포넌트" />
          </div>

          <div className="demo-section">
            <h3>useLocation 훅</h3>
            <p>현재 위치 정보는 <code>useLocation</code> 훅으로 접근합니다.</p>
            <CodeSnippet code={useLocationCode} title="useLocation 사용" />
          </div>
        </div>
      ),
    },
    {
      key: 'params',
      label: 'URL 파라미터',
      children: (
        <div>
          <div className="demo-section">
            <h3>동적 세그먼트 (useParams)</h3>
            <p>URL 경로의 동적 부분을 파라미터로 정의하고 <code>useParams</code>로 읽습니다.</p>
            <CodeSnippet code={dynamicParamsCode} title="동적 파라미터" />
          </div>

          <div className="demo-section">
            <h3>쿼리 스트링 (useSearchParams)</h3>
            <p>URL 쿼리 스트링은 <code>useSearchParams</code> 훅으로 읽고 쓸 수 있습니다.</p>
            <CodeSnippet code={searchParamsCode} title="useSearchParams 사용" />
          </div>
        </div>
      ),
    },
    {
      key: 'project-pattern',
      label: '본 프로젝트 패턴',
      children: (
        <div>
          <div className="demo-section">
            <h3>탭 기반 SPA와 최소 라우팅</h3>
            <p>
              본 프로젝트는 <strong>탭 시스템이 주 네비게이션</strong>이며,{' '}
              React Router는 <strong>브라우저 히스토리 동기화 용도로만</strong> 사용합니다.{' '}
              단일 라우트 <code>/app/:tabKey?</code>만 정의되어 있습니다.
            </p>
            <Card size="small" style={{ marginTop: 12, background: 'var(--info-bg)' }}>
              <strong>왜 이런 패턴을 사용하나요?</strong>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>여러 탭을 동시에 열어두고 빠르게 전환 (엔터프라이즈 워크플로우)</li>
                <li>탭 전환 시 컴포넌트가 언마운트되지 않아 상태 완벽 보존</li>
                <li>브라우저 뒤로/앞으로 버튼으로 이전 탭 복원 가능</li>
              </ul>
            </Card>
            <CodeSnippet code={projectRouterCode} title="본 프로젝트 라우터 설정" />
          </div>

          <div className="demo-section">
            <h3>useTabRouteSync 훅</h3>
            <p>탭 상태와 URL을 양방향으로 동기화하는 커스텀 훅입니다.</p>
            <CodeSnippet code={tabRouteSyncCode} title="useTabRouteSync 훅" />
          </div>

          <div className="demo-section">
            <h3>왜 React Router를 최소로 사용하는가</h3>
            <CodeSnippet code={whyMinimalRoutingCode} title="최소 라우팅 사용 이유" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>React Router 가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          오프라인 참조용 React Router v7 튜토리얼
        </p>
      </div>
      <Tabs items={items} />
    </div>
  );
}
