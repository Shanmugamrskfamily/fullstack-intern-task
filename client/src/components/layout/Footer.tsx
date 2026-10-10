import { Cookie, Globe, Heart, LayoutGrid, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { BrandLogo } from '@/components/brand/BrandMark';
import { cn } from '@/lib/utils';

const DEVELOPER = {
  name: 'Shanmugam R',
  role: 'Full Stack Developer · React · Next.js · Node.js',
  email: 'shanmugamrskfamily@gmail.com',
  portfolio: 'https://shanmugam-portfolio.vercel.app',
  github: 'https://github.com/Shanmugamrskfamily',
  linkedin: 'https://www.linkedin.com/in/shanmugamrskfamily',
};

// Brand glyphs (Simple Icons, CC0): Lucide no longer ships brand logos.
const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const Glyph = ({ path, size = 18 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={path} />
  </svg>
);

const iconLinkClass =
  'soft-raised-sm grid size-11 place-items-center rounded-[13px] text-muted-foreground transition hover:text-primary-text active:scale-95';

/** Developer credit with the SR logo, which switches with the theme. */
export function DeveloperCredit({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'soft-pressed flex flex-wrap items-center gap-4 rounded-[22px] p-3.5',
        className,
      )}
    >
      <img
        src="/brand/sr-mark-light.png"
        alt="Shanmugam R logo"
        width={60}
        height={60}
        className="size-[60px] rounded-2xl shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)] dark:hidden"
      />
      <img
        src="/brand/sr-mark-dark.png"
        alt="Shanmugam R logo"
        width={60}
        height={60}
        className="hidden size-[60px] rounded-2xl shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)] dark:block"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-extrabold tracking-[0.1em] text-subtle uppercase">
          Designed &amp; developed by
        </p>
        <p className="mt-0.5 text-[17px] font-bold tracking-[-0.01em]">{DEVELOPER.name}</p>
        <p className="text-[13px] text-muted-foreground">{DEVELOPER.role}</p>
      </div>
      <div className="flex gap-2">
        <a
          className={iconLinkClass}
          href={DEVELOPER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Portfolio (opens in a new tab)"
        >
          <Globe className="size-[19px]" aria-hidden="true" />
        </a>
        <a
          className={iconLinkClass}
          href={DEVELOPER.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub (opens in a new tab)"
        >
          <Glyph path={GITHUB_PATH} />
        </a>
        <a
          className={iconLinkClass}
          href={DEVELOPER.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn (opens in a new tab)"
        >
          <Glyph path={LINKEDIN_PATH} size={17} />
        </a>
        <a
          className={iconLinkClass}
          href={`mailto:${DEVELOPER.email}`}
          aria-label={`Email ${DEVELOPER.name}`}
        >
          <Mail className="size-[19px]" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

const footerLinkClass =
  'soft-raised-sm inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold text-muted-foreground transition hover:text-primary-text active:scale-95';

export function Footer() {
  return (
    <footer className="soft-raised mt-14 grid gap-6 rounded-[26px] p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <Link to="/templates" aria-label="Layora home" className="inline-block rounded-[14px]">
          <BrandLogo size={38} />
        </Link>
        <p className="mt-3 max-w-[44ch] text-[13.5px] leading-relaxed text-muted-foreground">
          A mini SaaS template store. Browse hand-picked templates, save your favourites and pick up
          right where you left off.
        </p>
        <nav aria-label="Footer" className="mt-4 flex flex-wrap gap-2">
          <Link to="/templates" className={footerLinkClass}>
            <LayoutGrid className="size-[15px]" aria-hidden="true" /> Templates
          </Link>
          <Link to="/favorites" className={footerLinkClass}>
            <Heart className="size-[15px]" aria-hidden="true" /> Favorites
          </Link>
          <Link to="/cookies" className={footerLinkClass}>
            <Cookie className="size-[15px]" aria-hidden="true" /> Cookie policy
          </Link>
        </nav>
      </div>
      <DeveloperCredit />
      <div className="flex flex-col gap-2 border-t border-line pt-4 text-[12.5px] text-subtle sm:flex-row sm:justify-between lg:col-span-2">
        <span>© {new Date().getFullYear()} Layora · Full-stack assessment project</span>
        <span>React · Express · MongoDB · Tailwind CSS</span>
      </div>
    </footer>
  );
}
