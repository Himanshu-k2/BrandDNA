import { createBrowserRouter, Navigate, RouterProvider, useSearchParams } from 'react-router-dom';
import { AppFrame } from '@/components/mono/AppFrame';
import { BradProvider } from '@/components/brad/BradProvider';
import { SessionProvider, useSession, type Role } from '@/state/session';
import { AlertsPage } from '@/screens/AlertsPage';
import { AuditLedger } from '@/screens/AuditLedger';
import { BrandManagerAssets } from '@/screens/BrandManagerAssets';
import { BrandManagerDashboard } from '@/screens/BrandManagerDashboard';
import { BrandManagerUploads } from '@/screens/BrandManagerUploads';
import { BrandWorkspaces } from '@/screens/BrandWorkspaces';
import { GuidelinesHub } from '@/screens/GuidelinesHub';
import { HomeDashboard } from '@/screens/HomeDashboard';
import { LoginScreen } from '@/screens/LoginScreen';
import { LogoGuidelines } from '@/screens/LogoGuidelines';
import { DesignSystem } from '@/screens/DesignSystem';
import { RouteError } from '@/screens/RouteError';
import { ReviewerQueue } from '@/screens/ReviewerQueue';
import { ReviewStudio } from '@/screens/ReviewStudio';
import { SettingsPage } from '@/screens/SettingsPage';
import { SubmissionsPage } from '@/screens/SubmissionsPage';
import { UsersPage } from '@/screens/UsersPage';

/** `/dashboard?role=` → Creator Dashboard, Reviewer Dashboard, Platform Dashboard (admin), or Brand Manager Dashboard. */
function Dashboard() {
  const [params] = useSearchParams();
  const { persona } = useSession();
  const param = params.get('role');
  const view: Role =
    param === 'creator' || param === 'reviewer' || param === 'admin' || param === 'brand_manager'
      ? param
      : persona.role;
  if (view === 'brand_manager') return <BrandManagerDashboard />;
  return <HomeDashboard key={view} view={view} />;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginScreen />, errorElement: <RouteError /> },
  {
    element: <AppFrame />,
    errorElement: <RouteError />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/content', element: <SubmissionsPage scope="mine" /> },
      { path: '/dashboard/queue', element: <ReviewerQueue /> },
      { path: '/brand-manager/assets', element: <BrandManagerAssets /> },
      { path: '/brand-manager/uploads', element: <BrandManagerUploads /> },
      { path: '/reviews/:id', element: <ReviewStudio /> },
      { path: '/submissions', element: <SubmissionsPage scope="all" /> },
      { path: '/brands', element: <BrandWorkspaces /> },
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/notifications', element: <AlertsPage /> },
      { path: '/admin/users', element: <UsersPage /> },
      { path: '/audit', element: <AuditLedger /> },
      { path: '/guidelines', element: <GuidelinesHub /> },
      { path: '/settings', element: <SettingsPage /> },
      // Dev reference for the logo system — intentionally not in the navigation.
      { path: '/brand', element: <LogoGuidelines /> },
      // Dev reference for tokens + status components — intentionally not in the navigation.
      { path: '/design-system', element: <DesignSystem /> }
    ]
  },
  { path: '*', element: <Navigate to="/login" replace /> }
]);

export function App() {
  return (
    <SessionProvider>
      {/* Brad's conversation lives above the router so it survives navigation (memory only). */}
      <BradProvider>
        <RouterProvider router={router} />
      </BradProvider>
    </SessionProvider>
  );
}
