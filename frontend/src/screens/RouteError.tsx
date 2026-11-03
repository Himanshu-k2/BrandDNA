import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { OfflineErrorScreen } from '@/screens/OfflineErrorScreen';

/** Full-page error / not-found state matching user sketch: characters centered above 404 text on Clean White. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (typeof document !== 'undefined') {
    document.title = notFound ? '404 · Page Not Found | BrandDNA' : 'Something went wrong | BrandDNA';
  }

  return <OfflineErrorScreen forced404={notFound} />;
}
