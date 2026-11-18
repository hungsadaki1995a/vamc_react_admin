import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/auth/auth-guard';
import LoginPage from '@/features/auth/login-page';
import FindIdPage from '@/features/auth/find-id-page';
import AppLayout from './app-layout';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from './route-constants';

/** Top-level application route configuration. */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PUBLIC_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={PUBLIC_ROUTES.FIND_ID} element={<FindIdPage />} />
        {PRIVATE_ROUTES.map((path) => (
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
        <Route path="*" element={<Navigate to="/members" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
