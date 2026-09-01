import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReactLenis, useLenis } from 'lenis/react';

/**
 * Lenis intercepts native scrolling, so React Router's default "stay at the
 * same scroll offset on navigation" behavior has to be replaced explicitly —
 * this snaps back to the top of the page on every route change.
 */
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return null;
}

/**
 * App-wide smooth scroll powered by Lenis (https://lenis.dev, MIT License).
 * `root` registers this instance on the global useLenis() context so any
 * component (e.g. a future scroll-progress indicator) can read/drive it.
 */
export default function SmoothScroll({ children }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        touchMultiplier: 1.5,
      }}
    >
      <ScrollToTopOnNavigate />
      {children}
    </ReactLenis>
  );
}
