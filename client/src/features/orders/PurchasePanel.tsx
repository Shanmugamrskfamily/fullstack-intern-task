import {
  BadgeCheck,
  BadgePercent,
  Download,
  LibraryBig,
  Lock,
  PartyPopper,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { formatDate, formatInr } from '@/features/templates/format';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/api';
import { GST_RATE, priceBreakdown } from './pricing';
import { useOwnedTemplates, usePurchase } from './queries';

function SummaryRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'success';
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        strong && 'text-[16px]',
        tone === 'success' && 'text-success',
      )}
    >
      <dt className={cn('min-w-0', strong ? 'font-extrabold' : !tone && 'text-muted-foreground')}>
        {label}
      </dt>
      <dd className={cn('tabular-nums', strong ? 'font-extrabold' : 'font-bold')}>{value}</dd>
    </div>
  );
}

/**
 * Demo checkout inside the template dialog. Free templates are claimed in one tap; paid
 * ones show an order summary (list price, launch-offer saving, 18% GST) first. Guests are
 * sent to sign in and come straight back here; nothing is bought on their behalf.
 */
export function PurchasePanel({ template }: { template: Template }) {
  const { isAuthenticated } = useAuth();
  const owned = useOwnedTemplates().get(template.id);
  const purchase = usePurchase(template);
  const navigate = useNavigate();
  const location = useLocation();
  const [reviewing, setReviewing] = useState(false);
  const buyRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const reviewedRef = useRef(false);
  const { list, discount, price, gst, total } = priceBreakdown(
    template.price_inr,
    template.original_price_inr,
  );
  const onOffer = discount > 0;

  // Keep keyboard focus on the step the user is in.
  useEffect(() => {
    if (reviewing) {
      reviewedRef.current = true;
      confirmRef.current?.focus();
    } else if (reviewedRef.current) {
      buyRef.current?.focus();
    }
  }, [reviewing]);

  if (owned) {
    return (
      <div className="soft-pressed rounded-[18px] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-text">
            <BadgeCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold">In your library</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              Order <span className="font-bold tabular-nums">{owned.order_number}</span> ·{' '}
              {formatDate(owned.purchased_at)} ·{' '}
              {owned.total_inr === 0 ? 'Free' : `${formatInr(owned.total_inr)} paid`}
            </p>
            {owned.discount_inr > 0 && (
              <p className="mt-1 text-[13px] font-bold text-success">
                You saved {formatInr(owned.discount_inr)} with the launch offer
              </p>
            )}
          </div>
        </div>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link to="/library">
            <LibraryBig className="size-[17px]" aria-hidden="true" /> Open my library
          </Link>
        </Button>
      </div>
    );
  }

  const start = () => {
    if (!isAuthenticated) {
      toast(template.is_free ? 'Sign in to get this template' : 'Sign in to buy this template', {
        description: 'You’ll come straight back here.',
      });
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (template.is_free) purchase.mutate();
    else setReviewing(true);
  };

  return (
    <div className="soft-pressed rounded-[18px] p-4">
      {onOffer && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E11D48] to-[#F97316] px-3 py-1 text-[12px] font-extrabold tracking-[0.02em] text-white shadow-[0_6px_14px_-6px_rgb(225_29_72/0.75)]">
          <BadgePercent className="size-3.5" aria-hidden="true" /> Launch offer ·{' '}
          {template.discount_percent}% off
        </p>
      )}

      <div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.06em] text-subtle uppercase">Price</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span
              className={cn(
                'text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums',
                template.is_free && 'text-success',
              )}
            >
              {template.is_free ? 'Free' : formatInr(price)}
            </span>
            {onOffer && (
              <span className="text-[13.5px] font-semibold text-subtle">
                M.R.P. <s className="tabular-nums">{formatInr(list)}</s>
              </span>
            )}
          </p>
        </div>
        {/* Saving and GST sit on one line under the price at every width. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {onOffer && (
            <span className="inline-flex h-7 items-center rounded-full bg-success-soft px-2.5 text-[12.5px] font-extrabold text-success">
              You save {formatInr(discount)}
            </span>
          )}
          <span className="text-[12.5px] leading-snug text-subtle">
            {template.is_free
              ? 'Yours to keep, no cost'
              : `+ ${formatInr(gst)} GST (${GST_RATE * 100}%)`}
          </span>
        </div>
      </div>

      {reviewing ? (
        <div className="mt-4">
          <h3 className="sr-only">Order summary</h3>
          <dl className="grid gap-2 text-[14px]">
            <SummaryRow
              label={onOffer ? `${template.name} (M.R.P.)` : template.name}
              value={formatInr(list)}
            />
            {onOffer && (
              <SummaryRow
                label={`Launch offer (${template.discount_percent}% off)`}
                value={`−${formatInr(discount)}`}
                tone="success"
              />
            )}
            <SummaryRow label={`GST (${GST_RATE * 100}%)`} value={formatInr(gst)} />
            <div className="my-1 border-t border-dashed border-line" aria-hidden="true" />
            <SummaryRow label="Total" value={formatInr(total)} strong />
          </dl>
          {onOffer && (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-[13px] font-bold text-success">
              <PartyPopper className="size-4 shrink-0" aria-hidden="true" />
              You save {formatInr(discount)} on this order
            </p>
          )}
          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button
              size="lg"
              className="sm:w-32"
              onClick={() => setReviewing(false)}
              disabled={purchase.isPending}
            >
              Cancel
            </Button>
            <Button
              ref={confirmRef}
              variant="primary"
              size="lg"
              // flex-1 only in the side-by-side layout: in a column it would squash the height.
              className="sm:flex-1"
              onClick={() => purchase.mutate(undefined, { onSuccess: () => setReviewing(false) })}
              loading={purchase.isPending}
              loadingText="Processing…"
            >
              <Lock className="size-[17px]" aria-hidden="true" /> Confirm order · {formatInr(total)}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={buyRef}
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          onClick={start}
          loading={purchase.isPending}
          loadingText="Adding to your library…"
        >
          {template.is_free ? (
            <>
              <Download className="size-[18px]" aria-hidden="true" /> Get it free
            </>
          ) : (
            <>
              <ShoppingBag className="size-[18px]" aria-hidden="true" /> Buy for {formatInr(price)}
            </>
          )}
        </Button>
      )}

      <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-subtle">
        <ShieldCheck className="mt-px size-4 shrink-0 text-success" aria-hidden="true" />
        Demo checkout: no real payment is taken and no card details are collected.
      </p>
    </div>
  );
}
