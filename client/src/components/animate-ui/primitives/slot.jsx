/**
 * Adapted from Animate UI (https://animate-ui.com) — MIT License.
 * Source: imskyleen/animate-ui, apps/www/registry/primitives/animate/slot.
 *
 * Merges an incoming ref/event handlers/className/style onto a single child
 * element. Used by AnimateIcon's `asChild` mode so the animated icon's
 * hover/tap handlers and view-tracking ref attach directly onto the wrapped
 * SVG icon instead of an extra wrapper element.
 *
 * The upstream version targets React 19, where `ref` is a plain prop
 * (`children.props.ref`) and it promotes the child to a `motion.create()`
 * component to guarantee ref support. On React 18, `ref` lives on
 * `children.ref` (never in `.props`), and `motion.create()` wrapping an
 * already-forwardRef'd component turned out to not reliably forward the ref
 * either (confirmed via a live "Function components cannot be given refs"
 * warning during testing). `React.cloneElement` is the standard React-18-safe
 * way to merge a ref onto an existing element — it's what Radix's own Slot
 * uses — and every icon component here already renders a `motion.svg`
 * directly, so there's nothing left for `motion.create()` to add.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    });
  };
}

function mergeProps(childProps, slotProps) {
  const merged = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(childProps.className, slotProps.className);
  }

  if (childProps.style || slotProps.style) {
    merged.style = { ...childProps.style, ...slotProps.style };
  }

  return merged;
}

const Slot = React.forwardRef(function Slot({ children, ...props }, ref) {
  if (!React.isValidElement(children)) return null;

  const mergedProps = mergeProps(children.props, props);

  return React.cloneElement(children, { ...mergedProps, ref: mergeRefs(children.ref, ref) });
});

export { Slot };
