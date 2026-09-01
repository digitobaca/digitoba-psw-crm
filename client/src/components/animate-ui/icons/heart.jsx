'use client';

// Ported from Animate UI (https://animate-ui.com) — MIT License. See icon.jsx.
import * as React from 'react';
import { motion } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper } from '@/components/animate-ui/icons/icon.jsx';

const animations = {
  default: {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.9, 1.2, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path: {},
  },
  fill: {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.9, 1.2, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path: {
      initial: { fill: 'currentColor', fillOpacity: 0 },
      animate: { fillOpacity: 1, transition: { delay: 0.2 } },
    },
  },
};

// React.forwardRef is required here (unlike upstream, which targets React 19):
// Slot's motion.create(IconComponent) attaches its ref to this component, and
// without forwardRef React 18 silently drops it — breaking animateOnView.
const IconComponent = React.forwardRef(function IconComponent({ size, ...props }, ref) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={variants.group}
      initial="initial"
      animate={controls}
      {...props}
    >
      <motion.path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
});

function Heart(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, Heart, Heart as HeartIcon };
