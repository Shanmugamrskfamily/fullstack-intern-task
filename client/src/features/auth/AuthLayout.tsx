import { ArrowLeft, Heart, Search, ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { BrandLogo } from '@/components/brand/BrandMark';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DeveloperCredit } from '@/components/layout/Footer';

const showcase = [
  {
    slug: 'nimbus-saas-landing',
    name: 'Nimbus SaaS Landing',
    saved: true,
    style: 'left-0 top-14 -rotate-6',
  },
  {
    slug: 'cartly-storefront',
    name: 'Cartly Storefront',
    saved: true,
    style: 'left-[46%] top-6 rotate-[4deg] z-[2]',
  },
  {
    slug: 'pulse-analytics',
    name: 'Pulse Analytics',
    saved: false,
    style: 'left-[22%] top-[170px] -rotate-1 z-[3]',
  },
];

const trust = [
  { icon: ShieldCheck, text: 'JWT-secured, bcrypt-hashed accounts' },
  { icon: Heart, text: 'Favourites synced to your account' },
  { icon: Search, text: 'Search and filter by category' },
];

/** Split layout for sign-in and sign-up: brand story on the left (desktop), form on the right. */
export function AuthLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-9 lg:p-7">
      <aside className="soft-raised relative hidden flex-col overflow-hidden rounded-[34px] p-11 lg:flex">
        <Link
          to="/templates"
          aria-label="Layora, browse templates"
          className="w-fit rounded-[14px]"
        >
          <BrandLogo size={46} />
        </Link>
        <h2 className="mt-10 max-w-[520px] text-[40px] leading-[1.1] font-extrabold tracking-[-0.04em] [word-spacing:0.06em]">
          Every great product starts with a <span className="text-gradient">great template.</span>
        </h2>
        <p className="mt-3.5 max-w-[460px] text-[16px] leading-relaxed text-muted-foreground">
          Sign in to save templates to your shelf and pick up right where you left off.
        </p>
        <div className="relative my-5 min-h-[330px] flex-1" aria-hidden="true">
          {showcase.map((item) => (
            <div
              key={item.slug}
              className={`soft-raised absolute w-[270px] rounded-[18px] p-2.5 ${item.style}`}
            >
              <img
                src={`/showcase/${item.slug}.svg`}
                alt=""
                width={640}
                height={400}
                className="aspect-[16/10] w-full rounded-xl object-cover"
              />
              <div className="flex items-center justify-between px-1 pt-2.5 pb-0.5 text-[13px] font-bold">
                {item.name}
                <Heart
                  className={
                    item.saved
                      ? 'size-[15px] fill-[#E11D48] text-[#E11D48]'
                      : 'size-[15px] text-subtle'
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-3 gap-3.5">
          {trust.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="soft-pressed flex items-center gap-2.5 rounded-2xl p-3.5 text-[13px] leading-snug font-semibold text-muted-foreground"
            >
              <span className="soft-raised-sm grid size-[34px] shrink-0 place-items-center rounded-[11px] text-primary-text">
                <Icon className="size-[17px]" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <Link
            to="/templates"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-2 text-[14px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-[18px]" aria-hidden="true" /> Browse templates
          </Link>
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[460px]">
            <Link
              to="/templates"
              aria-label="Layora, browse templates"
              className="mb-7 inline-block rounded-[14px] lg:hidden"
            >
              <BrandLogo size={42} />
            </Link>
            <Outlet />
          </div>
        </main>
        <DeveloperCredit className="mt-auto" />
      </div>
    </div>
  );
}
