import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Template } from '@/types/api';

/** Phones and tablets get the native share sheet; desktops copy the link. */
const prefersNativeShare = () =>
  typeof navigator.share === 'function' &&
  Boolean(window.matchMedia?.('(pointer: coarse)').matches);

export function ShareButton({ template }: { template: Template }) {
  const native = prefersNativeShare();
  const url = `${window.location.origin}/templates/${template.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', { description: 'Share it with your team.' });
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };

  const share = async () => {
    if (!native) return copyLink();
    try {
      await navigator.share({
        title: `${template.name} · Layora`,
        text: template.description,
        url,
      });
    } catch (error) {
      // Closing the share sheet is not an error; anything else falls back to copying.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyLink();
    }
  };

  return (
    <Button size="lg" onClick={() => void share()}>
      {native ? (
        <Share2 className="size-[17px]" aria-hidden="true" />
      ) : (
        <Link2 className="size-[17px]" aria-hidden="true" />
      )}
      {native ? 'Share' : 'Copy link'}
    </Button>
  );
}
