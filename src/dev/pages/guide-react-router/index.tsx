import { Tabs, Card } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

// ============================================================
// Basic routing example
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

// Route configuration
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

// Using it in a component
function UserDetailPage() {
  const user = useLoaderData();

  return (
    <div>
      <h1>{user.name}</h1>
      <Form method="post">
        <input name="name" defaultValue={user.name} />
        <button type="submit">Save</button>
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
      <h1>An unexpected error occurred</h1>
      <p>{error?.message}</p>
    </div>
  );
}`;

// ============================================================
// Nested route example
// ============================================================

const nestedRouteCode = `import { Outlet } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true, // index route: same path as the parent
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

// Layout component
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
        <Outlet /> {/* where child routes render */}
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
      <h1>Product detail — ID: {productId}</h1>
    </div>
  );
}

// If the URL is /products/123
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

// In the child component
function ChildPage() {
  const { user, theme } = useOutletContext<LayoutContext>();

  return <div>Current theme: {theme}</div>;
}`;

// ============================================================
// Navigation example
// ============================================================

const useNavigateCode = `import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    await loginAPI(credentials);

    // Programmatic navigation
    navigate('/dashboard');

    // Same effect as pressing back
    navigate(-1);

    // Replace the history entry (prevents going back)
    navigate('/dashboard', { replace: true });

    // Navigate with state
    navigate('/profile', {
      state: { from: 'login', message: 'Welcome!' }
    });
  };

  return (
    <form onSubmit={handleLogin}>
      <button type="submit">Sign in</button>
    </form>
  );
}`;

const linkCode = `import { Link, NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      {/* Plain Link */}
      <Link to="/about">About</Link>
      <Link to="/products/123">Product 123</Link>

      {/* Relative paths */}
      <Link to="..">To parent</Link>
      <Link to="../sibling">To sibling</Link>

      {/* Passing state */}
      <Link to="/profile" state={{ from: 'nav' }}>
        Profile
      </Link>

      {/* NavLink: styles the active link */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          isActive ? 'nav-link active' : 'nav-link'
        }
        style={({ isActive }) => ({
          color: isActive ? 'red' : 'black',
        })}
      >
        Dashboard
      </NavLink>
    </nav>
  );
}`;

const navigateComponentCode = `import { Navigate } from 'react-router-dom';

function ProtectedPage() {
  const { isAuthenticated } = useAuth();

  // Redirect when not signed in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div>Protected page</div>;
}`;

const useLocationCode = `import { useLocation, useNavigate } from 'react-router-dom';

function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.pathname: the current path
  // location.search: the query string (?key=value)
  // location.hash: the hash (#section)
  // location.state: state passed through navigate

  useEffect(() => {
    if (location.state?.message) {
      message.success(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  return (
    <div>
      <p>Current path: {location.pathname}</p>
      <p>Query: {location.search}</p>
    </div>
  );
}`;

// ============================================================
// URL parameter example
// ============================================================

const dynamicParamsCode = `import { useParams } from 'react-router-dom';

// Route configuration
const router = createBrowserRouter([
  {
    path: '/projects/:projectId/tasks/:taskId',
    element: <TaskDetailPage />,
  },
  {
    path: '/users/:userId?', // Optional parameter
    element: <UserPage />,
  },
]);

// Component
function TaskDetailPage() {
  const { projectId, taskId } = useParams();

  return (
    <div>
      <h1>Project {projectId}</h1>
      <h2>Task {taskId}</h2>
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
        Electronics
      </button>
    </div>
  );
}`;

// ============================================================
// Pattern used by this project
// ============================================================

const projectRouterCode = `// src/main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';

// Minimal router setup: a single route
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

// React Router only keeps browser history in sync
// Actual navigation is handled by the tab system
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
 * Hook that keeps tabs and the URL in sync both ways
 *
 * 1. Tab change -> URL update (pushState)
 * 2. Browser back/forward -> activate the tab (popstate)
 * 3. Menu path of the active tab -> highlight the IconRail icon
 */
export function useTabRouteSync() {
  const navigate = useNavigate();
  const { tabKey: urlTabKey } = useParams();
  const { activeTabKey, tabs, setActiveTab } = useTabStore();
  const { setActiveRailKey } = useMenuStore();

  // Tab change -> URL update
  useEffect(() => {
    if (activeTabKey && \`/app/\${activeTabKey}\` !== window.location.pathname) {
      navigate(\`/app/\${activeTabKey}\`, { replace: false });
    }
  }, [activeTabKey, navigate]);

  // URL change -> activate the tab (browser back/forward)
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
 * Why this project uses React Router so sparingly
 *
 * 1. The tab system is the primary navigation
 *    - Every page opens as a tab
 *    - Many tabs stay open at once and keep their state (toggled with display:none)
 *
 * 2. React Router supports only one active route
 *    - It cannot keep several tabs mounted at the same time
 *    - Components would unmount and remount every time, losing their state
 *
 * 3. The URL is used only for browser history
 *    - Back/forward restores the previous tab
 *    - A page reload restores the active tab
 */

// Core logic of TabContent.tsx
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
            {Component ? <Component /> : <div>No component</div>}
          </div>
        );
      })}
    </div>
  );
}`;

// ============================================================
// Main component
// ============================================================

export default function GuideReactRouter() {
  const items = [
    {
      key: 'basic',
      label: 'Basic routing',
      children: (
        <div>
          <div className="demo-section">
            <h3>Setting up createBrowserRouter</h3>
            <p>
              React Router v7 uses the data router API.{' '}
              Define routes with <code>createBrowserRouter</code> and wrap the app in{' '}
              <code>RouterProvider</code>.
            </p>
            <CodeSnippet code={basicRouterCode} title="Basic router setup" />
          </div>

          <div className="demo-section">
            <h3>Loaders and actions</h3>
            <p>
              A <code>loader</code> fetches data before the route renders, and an{' '}
              <code>action</code> handles mutations such as form submissions.
            </p>
            <CodeSnippet code={loaderActionCode} title="Using loaders and actions" />
          </div>

          <div className="demo-section">
            <h3>Error Element</h3>
            <p>
              <code>errorElement</code> handles errors thrown inside the route.
            </p>
            <CodeSnippet code={errorElementCode} title="Error handling" />
          </div>
        </div>
      ),
    },
    {
      key: 'nested',
      label: 'Nested routes',
      children: (
        <div>
          <div className="demo-section">
            <h3>Outlet and layout routes</h3>
            <p>
              Nested routes let you share a layout and swap only part of the page.{' '}
              The parent route renders an <code>Outlet</code> component.
            </p>
            <CodeSnippet code={nestedRouteCode} title="Nested routes and Outlet" />
          </div>

          <div className="demo-section">
            <h3>Reading dynamic segments with useParams</h3>
            <p>Dynamic segments of the URL path are read through the <code>useParams</code> hook.</p>
            <CodeSnippet code={useParamsCode} title="Using useParams" />
          </div>

          <div className="demo-section">
            <h3>Outlet Context</h3>
            <p>Use <code>Outlet context</code> to pass data from a parent layout down to its children.</p>
            <CodeSnippet code={outletContextCode} title="Outlet Context" />
          </div>
        </div>
      ),
    },
    {
      key: 'navigation',
      label: 'Navigation',
      children: (
        <div>
          <div className="demo-section">
            <h3>The useNavigate hook</h3>
            <p>Use the <code>useNavigate</code> hook for programmatic navigation.</p>
            <CodeSnippet code={useNavigateCode} title="Using useNavigate" />
          </div>

          <div className="demo-section">
            <h3>Link and NavLink</h3>
            <p>For declarative navigation use the <code>Link</code> or <code>NavLink</code> component.</p>
            <CodeSnippet code={linkCode} title="Link and NavLink" />
          </div>

          <div className="demo-section">
            <h3>The Navigate component</h3>
            <p>Use the <code>Navigate</code> component to redirect through conditional rendering.</p>
            <CodeSnippet code={navigateComponentCode} title="The Navigate component" />
          </div>

          <div className="demo-section">
            <h3>The useLocation hook</h3>
            <p>Read the current location through the <code>useLocation</code> hook.</p>
            <CodeSnippet code={useLocationCode} title="Using useLocation" />
          </div>
        </div>
      ),
    },
    {
      key: 'params',
      label: 'URL parameters',
      children: (
        <div>
          <div className="demo-section">
            <h3>Dynamic segments (useParams)</h3>
            <p>Declare the dynamic part of a path as a parameter and read it with <code>useParams</code>.</p>
            <CodeSnippet code={dynamicParamsCode} title="Dynamic parameters" />
          </div>

          <div className="demo-section">
            <h3>Query strings (useSearchParams)</h3>
            <p>The URL query string can be read and written with the <code>useSearchParams</code> hook.</p>
            <CodeSnippet code={searchParamsCode} title="Using useSearchParams" />
          </div>
        </div>
      ),
    },
    {
      key: 'project-pattern',
      label: 'Pattern used here',
      children: (
        <div>
          <div className="demo-section">
            <h3>A tab-based SPA with minimal routing</h3>
            <p>
              In this project the <strong>tab system is the primary navigation</strong>, and{' '}
              React Router is used <strong>only to keep browser history in sync</strong>.{' '}
              A single route, <code>/app/:tabKey?</code>, is defined.
            </p>
            <Card size="small" style={{ marginTop: 12, background: 'var(--info-bg)' }}>
              <strong>Why this pattern?</strong>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>Many tabs stay open and switching between them is instant (an enterprise workflow)</li>
                <li>Components are not unmounted on tab switch, so state is preserved perfectly</li>
                <li>The browser back/forward buttons restore the previous tab</li>
              </ul>
            </Card>
            <CodeSnippet code={projectRouterCode} title="Router setup in this project" />
          </div>

          <div className="demo-section">
            <h3>The useTabRouteSync hook</h3>
            <p>A custom hook that keeps tab state and the URL in sync both ways.</p>
            <CodeSnippet code={tabRouteSyncCode} title="The useTabRouteSync hook" />
          </div>

          <div className="demo-section">
            <h3>Why React Router is kept to a minimum</h3>
            <CodeSnippet code={whyMinimalRoutingCode} title="Reasons for minimal routing" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideReactRouter" />
      <Tabs items={items} />
    </div>
  );
}
