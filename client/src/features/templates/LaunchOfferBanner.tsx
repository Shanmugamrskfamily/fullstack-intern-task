import { ArrowRight, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

/** Kept in step with the seed data by a server test ("up to 40% off"). */
const MAX_DISCOUNT = 40;

/**
 * Launch-offer strip above the catalogue. The gradient and white text read the same in
 * light and dark mode. On phones it stays compact: the actions sit side by side under
 * the headline and the explainer line is left to the price tags themselves.
 */
export function LaunchOfferBanner() {
  return (
    <section
      aria-label="Launch offer"
      className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] p-4 text-white shadow-[0_20px_40px_-20px_rgb(79_70_229/0.75)] sm:p-5 lg:mb-7"
    >
      {/* Soft light blobs for depth; purely decorative. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/15 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/3 size-44 rounded-full bg-[#F97316]/30 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm sm:size-12">
            <Sparkles className="size-5 sm:size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-white/80 uppercase">
              Launch offer
            </p>
            <p className="mt-1 text-[19px] leading-tight font-extrabold tracking-[-0.01em] sm:text-[22px]">
              Up to{' '}
              <span className="rounded-lg bg-white px-1.5 text-[#DB2777]">{MAX_DISCOUNT}% off</span>{' '}
              paid templates
            </p>
            <p className="mt-1.5 hidden text-[13px] leading-snug text-white/85 sm:block">
              The discount is already in the prices you see. Free templates stay free.
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2.5 md:flex">
          <Link
            to={{ search: '?price=paid' }}
            preventScrollReset
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[14px] bg-white px-4 text-[14px] font-extrabold text-[#4338CA] shadow-[0_10px_20px_-10px_rgb(15_23_42/0.5)] transition hover:brightness-105 active:scale-[0.97]"
          >
            Shop the offer <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to={{ search: '?price=free' }}
            preventScrollReset
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[14px] bg-white/15 px-4 text-[14px] font-extrabold text-white ring-1 ring-white/30 transition hover:bg-white/25 active:scale-[0.97]"
          >
            <Gift className="size-4" aria-hidden="true" /> Free picks
          </Link>
        </div>
      </div>
    </section>
  );
}
