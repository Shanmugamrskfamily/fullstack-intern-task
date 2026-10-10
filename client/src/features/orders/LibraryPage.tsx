import { ArrowRight, LayoutGrid, LibraryBig, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { EmptyState, ErrorState } from '@/components/feedback/States';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryColor } from '@/features/templates/categories';
import { formatDate, formatInr } from '@/features/templates/format';
import { safeUrl } from '@/lib/security';
import { usePageTitle } from '@/lib/use-page-title';
import { cn, pluralize } from '@/lib/utils';
import type { Order } from '@/types/api';
import { useOrders } from './queries';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="soft-pressed rounded-[14px] px-3.5 py-3">
      <dt className="text-[11px] font-bold tracking-[0.06em] text-subtle uppercase">{label}</dt>
      <dd
        className={cn(
          'mt-1 text-[16px] font-extrabold tabular-nums',
          tone === 'success' && 'text-success',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LibraryItem({ order, index }: { order: Order; index: number }) {
  const { template } = order;
  return (
    <article
      className="group soft-raised animate-card-in relative flex h-full flex-col gap-4 rounded-[22px] p-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:soft-lifted focus-within:soft-lifted sm:flex-row"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-2xl bg-inset sm:w-[210px]">
        <img
          src={safeUrl(template.thumbnail_url)}
          alt={`Preview of the ${template.name} template`}
          width={640}
          height={400}
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-1 pb-1 sm:py-1 sm:pr-2">
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-subtle">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: categoryColor(template.category_slug) }}
            aria-hidden="true"
          />
          {template.category}
        </span>
        <h2 className="mt-1.5 text-[17px] font-bold tracking-[-0.01em]">
          <Link
            to={`/library/${template.id}`}
            state={{ fromGrid: true }}
            preventScrollReset
            data-template-link={template.id}
            className="outline-none after:absolute after:inset-0 after:rounded-[22px]"
          >
            {template.name}
          </Link>
        </h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
          <dt className="sr-only">Order number</dt>
          <dd className="font-bold tabular-nums">{order.order_number}</dd>
          <dt className="sr-only">Purchased on</dt>
          <dd className="text-muted-foreground">{formatDate(order.purchased_at)}</dd>
          <dt className="sr-only">Paid</dt>
          <dd className="font-bold text-muted-foreground tabular-nums">
            {order.total_inr === 0 && order.discount_inr === 0 ? (
              <span className="text-success">Free</span>
            ) : (
              <>
                {formatInr(order.total_inr)}{' '}
                <span className="font-semibold text-subtle">incl. GST</span>
              </>
            )}
          </dd>
          {order.discount_inr > 0 && (
            <>
              <dt className="sr-only">Launch-offer saving</dt>
              <dd className="font-bold text-success tabular-nums">
                Saved {formatInr(order.discount_inr)}
              </dd>
            </>
          )}
        </dl>
        <span
          aria-hidden="true"
          className="mt-auto flex items-center gap-1.5 self-end pt-3 text-[13px] font-bold text-primary-text transition-[gap] group-hover:gap-2"
        >
          Details <ArrowRight className="size-[15px]" />
        </span>
      </div>
    </article>
  );
}

function LibrarySkeleton() {
  return (
    <ul className="grid gap-5 lg:grid-cols-2" aria-busy="true" aria-label="Loading your library">
      {Array.from({ length: 2 }, (_, i) => (
        <li key={i} className="soft-raised flex flex-col gap-4 rounded-[22px] p-3 sm:flex-row">
          <Skeleton className="aspect-[16/10] rounded-2xl sm:w-[210px]" />
          <div className="flex-1 py-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-3 h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function LibraryPage() {
  usePageTitle('My library');
  const orders = useOrders();
  const list = orders.data ?? [];
  const totalPaid = list.reduce((sum, order) => sum + order.total_inr, 0);
  const totalSaved = list.reduce((sum, order) => sum + order.discount_inr, 0);

  return (
    <>
      <div className="mt-8 mb-7 flex flex-col gap-5 lg:mt-11 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1
            id="page-title"
            tabIndex={-1}
            className="flex items-center gap-3.5 text-[32px] font-extrabold tracking-[-0.035em] outline-none sm:text-[38px]"
          >
            <span className="soft-raised grid size-[52px] place-items-center rounded-2xl text-primary-text">
              <LibraryBig className="size-[26px]" aria-hidden="true" />
            </span>
            My Library
          </h1>
          <p className="mt-2.5 text-[15px] text-muted-foreground" aria-live="polite">
            {orders.isPending
              ? 'Loading your library…'
              : list.length
                ? `${pluralize(list.length, 'template')} you own. Open one to see what's inside.`
                : 'Templates you buy or claim for free live here.'}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-semibold text-subtle">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Demo store: orders are simulated and no payment was taken.
          </p>
        </div>
        {list.length > 0 && (
          <dl className="grid grid-cols-3 gap-3 lg:w-[420px]">
            <Stat label="Owned" value={String(list.length)} />
            <Stat label="Paid" value={formatInr(totalPaid)} />
            <Stat label="Saved" value={formatInr(totalSaved)} tone="success" />
          </dl>
        )}
      </div>

      {orders.isPending ? (
        <LibrarySkeleton />
      ) : orders.isError && !orders.data ? (
        <ErrorState
          title="Couldn't load your library"
          message={orders.error.message}
          onRetry={() => void orders.refetch()}
          retrying={orders.isFetching}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="text-primary-text" aria-hidden="true" />}
          title="Your library is empty"
          description="Buy a template or grab a free one. Everything you get lands here, with its order details."
          action={
            <>
              <Button asChild variant="primary" size="lg">
                <Link to="/templates">
                  <LayoutGrid className="size-[17px]" aria-hidden="true" /> Browse templates
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/templates?price=free">See free templates</Link>
              </Button>
            </>
          }
        />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2" aria-label="Templates you own">
          {list.map((order, index) => (
            <li key={order.id}>
              <LibraryItem order={order} index={index} />
            </li>
          ))}
        </ul>
      )}
      <Outlet />
    </>
  );
}
