/**
 * Ported from Animate UI (https://animate-ui.com) — MIT License.
 * Source: imskyleen/animate-ui, apps/www/registry/hooks/use-is-in-view.
 * Converted from TypeScript to plain JS for this Vite/JS project.
 */
import * as React from 'react';
import { useInView } from 'motion/react';

function useIsInView(ref, options = {}) {
  const { inView, inViewOnce = false, inViewMargin = '0px' } = options;
  const localRef = React.useRef(null);
  React.useImperativeHandle(ref, () => localRef.current);
  const inViewResult = useInView(localRef, { once: inViewOnce, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  return { ref: localRef, isInView };
}

export { useIsInView };
