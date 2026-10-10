import { House, RefreshCw } from 'lucide-react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';

/** Last-resort error screen for unexpected render errors. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="soft-raised flex max-w-md flex-col items-center rounded-[30px] p-8 text-center">
        <span className="soft-raised grid size-20 place-items-center rounded-[24px]">
          <BrandMark size={58} />
        </span>
        <h1 className="mt-6 text-[24px] font-extrabold tracking-[-0.03em]">
          {notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
          {notFound
            ? "We couldn't find that page."
            : 'An unexpected error stopped this page from loading. Reloading usually fixes it.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" aria-hidden="true" /> Reload
          </Button>
          <Button asChild>
            <Link to="/templates">
              <House className="size-4" aria-hidden="true" /> Go to templates
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
