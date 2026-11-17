import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/auth/auth-guard';
import LoginPage from '@/features/auth/login-page';
import FindIdPage from '@/features/auth/find-id-page';
import AppLayout from './app-layout';

const PROTECTED_PATHS = [
  '/members',
  '/content-management/inquiry-management',
  '/content-management/faq',
  '/app/:tabKey?',
];

const LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/app/member.list', '/members'],
  ['/app/members', '/members'],
  ['/member', '/members'],
  ['/member/list', '/members'],
  ['/member-management', '/members'],
  ['/content-management', '/content-management/inquiry-management'],
  ['/inquiry-management', '/content-management/inquiry-management'],
  ['/app/inquiry-management', '/content-management/inquiry-management'],
  ['/app/content-management.inquiry-management', '/content-management/inquiry-management'],
  ['/app/content-management/inquiry-management', '/content-management/inquiry-management'],
  ['/faq', '/content-management/faq'],
  ['/faq-management', '/content-management/faq'],
  ['/content-management/faq-management', '/content-management/faq'],
  ['/app/faq', '/content-management/faq'],
  ['/app/faq-management', '/content-management/faq'],
  ['/app/content-management.faq', '/content-management/faq'],
  ['/app/content-management/faq', '/content-management/faq'],
];

/** Top-level application route configuration. */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        {PROTECTED_PATHS.map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          />
        ))}
        {LEGACY_REDIRECTS.map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
