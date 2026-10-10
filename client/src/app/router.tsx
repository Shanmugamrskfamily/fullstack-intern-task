import {
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
  Suspense,
  lazy,
} from 'react';
import { Navigate, Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import { PageLoader } from '@/components/brand/BrandLoader';
import { CookieNotice } from '@/components/feedback/CookieNotice';
import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { GuestRoute, ProtectedRoute } from '@/features/auth/route-guards';
import TemplatesPage from '@/features/templates/TemplatesPage';
import NotFoundPage from '@/pages/NotFoundPage';

// The catalogue loads with the app; everything else is split into its own chunk.
const TemplateDetailDialog = lazy(() => import('@/features/templates/TemplateDetailDialog'));
const FavoritesPage = lazy(() => import('@/features/favorites/FavoritesPage'));
const LibraryPage = lazy(() => import('@/features/orders/LibraryPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const CookiePolicyPage = lazy(() => import('@/pages/CookiePolicyPage'));

const page = (
  Component: LazyExoticComponent<ComponentType>,
  fallback: ReactNode = <PageLoader />,
) => (
  <Suspense fallback={fallback}>
    <Component />
  </Suspense>
);

/** Router-aware providers + app-wide UI that must live inside the router. */
function RootLayout() {
  return (
    <AuthProvider>
      <ScrollRestoration />
      <Outlet />
      <CookieNotice />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/templates" replace /> },
          {
            path: 'templates',
            element: <TemplatesPage />,
            children: [{ path: ':id', element: page(TemplateDetailDialog, null) }],
          },
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: 'favorites',
                element: page(FavoritesPage),
                children: [{ path: ':id', element: page(TemplateDetailDialog, null) }],
              },
              {
                path: 'library',
                element: page(LibraryPage),
                children: [{ path: ':id', element: page(TemplateDetailDialog, null) }],
              },
            ],
          },
          { path: 'cookies', element: page(CookiePolicyPage) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: page(LoginPage) },
              { path: 'register', element: page(RegisterPage) },
            ],
          },
        ],
      },
    ],
  },
]);
