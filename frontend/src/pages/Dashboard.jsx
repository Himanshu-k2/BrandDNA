import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import BrandManagerDashboard from './BrandManagerDashboard';
import CreatorDashboard from './CreatorDashboard';
import ReviewQueue from './ReviewQueue';

export default function Dashboard() {
  const { isPlatformAdmin, isReviewer, isBrandManager } = useAuth();

  if (isPlatformAdmin) {
    return <AdminDashboard />;
  }

  if (isReviewer) {
    return <ReviewQueue />;
  }

  if (isBrandManager) {
    return <BrandManagerDashboard />;
  }

  return <CreatorDashboard />;
}
