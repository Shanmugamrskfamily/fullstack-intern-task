import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { ServerWakeBanner } from '@/components/feedback/ServerWakeBanner';
import { Footer } from './Footer';
import { MobileTabBar } from './MobileTabBar';
import { Navbar } from './Navbar';

/** "Skip to content" is the first tab stop on every page. */
function SkipLink() {
  return (
    <a
      href="#main"
      className="soft-raised-lg fixed top-3 left-3 z-[90] -translate-y-24 rounded-xl px-4 py-3 text-[14px] font-bold text-primary-text transition focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}

/** Moves focus to the new page's heading after navigation (not for the detail dialog). */
function useFocusOnRouteChange() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[1] ?? '';
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [section]);
}

export function AppShell() {
  useFocusOnRouteChange();
  const navigation = useNavigation();

  return (
    <div className="min-h-dvh">
      <SkipLink />
      {navigation.state === 'loading' && (
        <div className="fixed inset-x-0 top-0 z-[95] h-[3px] overflow-hidden" aria-hidden="true">
          <div className="animate-indeterminate absolute inset-y-0 w-2/5 bg-gradient-to-r from-[#818CF8] to-primary" />
        </div>
      )}
      <div className="mx-auto max-w-[1400px] px-4 pt-3 sm:px-6 lg:px-10 lg:pt-5">
        <Navbar />
        <ServerWakeBanner />
        <OfflineBanner />
        <main id="main" tabIndex={-1} className="pb-28 outline-none md:pb-4">
          <Outlet />
        </main>
        <div className="pb-28 md:pb-10">
          <Footer />
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
