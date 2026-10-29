import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Core Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import BrandDetails from './pages/BrandDetails';
import CreateReview from './pages/CreateReview';
import ReviewDetails from './pages/ReviewDetails';
import Reviews from './pages/Reviews';
import ReviewQueue from './pages/ReviewQueue';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

// Role-Specific Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAuditLogs from './pages/AdminAuditLogs';
import BrandManagerDashboard from './pages/BrandManagerDashboard';
import BrandManagerUploads from './pages/BrandManagerUploads';
import BrandManagerAssets from './pages/BrandManagerAssets';
import CreatorDashboard from './pages/CreatorDashboard';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Role 1: Platform Admin & Reviewer Views */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin', 'reviewer']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review-queue"
          element={
            <ProtectedRoute roles={['admin', 'reviewer']}>
              <ReviewQueue />
            </ProtectedRoute>
          }
        />

        {/* Role 2: Brand Manager Views */}
        <Route
          path="/brand-manager/dashboard"
          element={
            <ProtectedRoute roles={['admin', 'brand_manager']}>
              <BrandManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand-manager/uploads"
          element={
            <ProtectedRoute roles={['admin', 'brand_manager']}>
              <BrandManagerUploads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand-manager/assets"
          element={
            <ProtectedRoute roles={['admin', 'brand_manager']}>
              <BrandManagerAssets />
            </ProtectedRoute>
          }
        />

        {/* Role 3: Content Creator Views */}
        <Route
          path="/creator/dashboard"
          element={<CreatorDashboard />}
        />
        <Route
          path="/reviews/new"
          element={
            <ProtectedRoute roles={['admin', 'creator', 'brand_manager']}>
              <CreateReview />
            </ProtectedRoute>
          }
        />

        {/* Shared Workspaces & Governance */}
        <Route path="/brands" element={<Brands />} />
        <Route path="/brands/:id" element={<BrandDetails />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/:id" element={<ReviewDetails />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
