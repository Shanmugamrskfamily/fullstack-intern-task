import { LayoutGrid } from 'lucide-react';
import { Link } from 'react-router';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/lib/use-page-title';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="grid min-h-[55dvh] place-items-center py-12">
      <div className="soft-raised flex max-w-md flex-col items-center rounded-[30px] p-8 text-center">
        <span className="soft-raised grid size-20 place-items-center rounded-[24px]">
          <BrandMark size={58} />
        </span>
        <p className="mt-6 text-[13px] font-extrabold tracking-[0.12em] text-subtle uppercase">
          Error 404
        </p>
        <h1
          id="page-title"
          tabIndex={-1}
          className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] outline-none"
        >
          This page doesn't exist
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
          The link may be broken, or the page may have moved. The templates are still where you left
          them.
        </p>
        <Button asChild variant="primary" size="lg" className="mt-6">
          <Link to="/templates">
            <LayoutGrid className="size-[17px]" aria-hidden="true" /> Back to templates
          </Link>
        </Button>
      </div>
    </div>
  );
}
