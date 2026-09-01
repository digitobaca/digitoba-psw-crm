import { useEffect } from 'react';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const DELAY_MS = 2500; // "within 2-3 sec" of landing
const STORAGE_KEY = 'cd_auto_consultation_shown';

/**
 * Auto-opens the "Book Your Free Consultation" modal ~2.5s after a
 * first-time visitor lands on the public site — once ever per browser
 * (localStorage-gated), so it doesn't nag a returning visitor on every page
 * load or every internal navigation within the same visit. Renders nothing
 * itself; mounted once in Layout so it fires from any public page.
 */
export default function AutoConsultationPopup() {
  const { openConsultation } = useConsultationModal();

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      // Private-browsing / storage blocked — fail open rather than never
      // showing the popup, but don't crash the page over it.
      alreadyShown = false;
    }
    if (alreadyShown) return;

    const timer = setTimeout(() => {
      openConsultation();
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Nothing to do if storage isn't available — worst case it pops up
        // again next visit, which is harmless.
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
