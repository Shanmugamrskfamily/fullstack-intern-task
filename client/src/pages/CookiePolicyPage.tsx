import { Ban, Cookie, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { usePageTitle } from '@/lib/use-page-title';

const ITEMS = [
  {
    key: STORAGE_KEYS.token,
    name: 'Sign-in session',
    purpose: 'Keeps you signed in so your favourites load securely.',
    lifetime: 'Until you log out, or 24 hours',
  },
  {
    key: STORAGE_KEYS.theme,
    name: 'Theme preference',
    purpose: 'Remembers whether you chose light or dark mode.',
    lifetime: 'Until you change it or clear site data',
  },
  {
    key: STORAGE_KEYS.cookieNotice,
    name: 'Notice seen',
    purpose: "Remembers that you've read the cookie notice, so it isn't shown again.",
    lifetime: '12 months',
  },
];

const NEVER = [
  'No analytics or tracking pixels',
  'No advertising cookies',
  'No third-party cookies',
  'No selling or sharing your data',
];

export default function CookiePolicyPage() {
  usePageTitle('Cookie & storage policy');

  const showNoticeAgain = () => {
    storage.remove(STORAGE_KEYS.cookieNotice);
    toast.success('Done', { description: 'The cookie notice will show again on your next visit.' });
  };

  return (
    <>
      <div className="mt-8 mb-7 lg:mt-11">
        <h1
          id="page-title"
          tabIndex={-1}
          className="flex items-center gap-3.5 text-[30px] font-extrabold tracking-[-0.035em] [word-spacing:0.06em] outline-none sm:text-[38px]"
        >
          <span className="soft-raised grid size-[52px] shrink-0 place-items-center rounded-2xl text-primary-text">
            <Cookie className="size-[26px]" aria-hidden="true" />
          </span>
          Cookie &amp; storage policy
        </h1>
        <p className="mt-2.5 text-[15px] text-muted-foreground">
          Last updated 10 Oct 2026 · 1 minute read. Short version: Layora stores only what it needs
          to work.
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.6fr_1fr]">
        <section className="soft-raised rounded-[26px] p-5 sm:p-6" aria-labelledby="stored-heading">
          <h2 id="stored-heading" className="text-[19px] font-extrabold tracking-[-0.02em]">
            What Layora stores on your device
          </h2>
          <p className="mt-2.5 max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
            Layora doesn't set tracking or advertising cookies. It keeps three small items in your
            browser's local storage. All three are strictly necessary for the features you use, so
            there's nothing to accept or reject.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-y-2.5 text-left text-[14px]">
              <caption className="sr-only">Items stored in your browser</caption>
              <thead>
                <tr className="text-[11.5px] font-extrabold tracking-[0.07em] text-subtle uppercase">
                  <th scope="col" className="px-3.5">
                    Item
                  </th>
                  <th scope="col" className="px-3.5">
                    Purpose
                  </th>
                  <th scope="col" className="px-3.5">
                    Lifetime
                  </th>
                </tr>
              </thead>
              <tbody>
                {ITEMS.map((item) => (
                  <tr key={item.key} className="align-top text-muted-foreground">
                    <td className="rounded-l-xl bg-inset p-3.5">
                      <code className="rounded-lg bg-primary-soft px-2 py-1 font-mono text-[12.5px] whitespace-nowrap text-primary-text">
                        {item.key}
                      </code>
                      <b className="mt-1.5 block text-[13.5px] text-foreground">{item.name}</b>
                    </td>
                    <td className="bg-inset p-3.5 leading-relaxed">{item.purpose}</td>
                    <td className="rounded-r-xl bg-inset p-3.5 leading-relaxed">{item.lifetime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-6 text-[19px] font-extrabold tracking-[-0.02em]">What we never do</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {NEVER.map((item) => (
              <li
                key={item}
                className="soft-pressed flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold text-muted-foreground"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-rose-soft text-rose-text">
                  <Ban className="size-[15px]" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid content-start gap-7">
          <section
            className="soft-raised rounded-[26px] p-5 sm:p-6"
            aria-labelledby="controls-heading"
          >
            <h2 id="controls-heading" className="text-[19px] font-extrabold tracking-[-0.02em]">
              Your controls
            </h2>
            <ol className="mt-3.5 grid gap-3">
              {[
                ['Log out', 'to remove your session token immediately.'],
                ['Switch theme', 'any time with the sun/moon button in the header.'],
                ['Clear site data', 'in your browser settings to remove everything Layora stored.'],
              ].map(([title, text], i) => (
                <li
                  key={title}
                  className="flex gap-3 text-[14px] leading-relaxed text-muted-foreground"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-primary-soft text-[13px] font-extrabold text-primary-text">
                    {i + 1}
                  </span>
                  <span>
                    <b className="text-foreground">{title}</b> {text}
                  </span>
                </li>
              ))}
            </ol>
            <Button className="mt-5" onClick={showNoticeAgain}>
              <RefreshCw className="size-4" aria-hidden="true" /> Show the cookie notice again
            </Button>
          </section>
          <section className="soft-raised rounded-[26px] p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">Questions?</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
              This is an assessment project. Reach the developer through the links in the footer
              below.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
