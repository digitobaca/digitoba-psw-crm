'use client';

// Ported from Animate UI (https://animate-ui.com) — MIT License. See icon.jsx.
import * as React from 'react';
import { motion } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper } from '@/components/animate-ui/icons/icon.jsx';

const animations = {
  default: {
    circle: {},
    path: {
      initial: { pathLength: 1, opacity: 1, scale: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        scale: [1, 1.1, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
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
      {...props}
    >
      <motion.circle cx="12" cy="12" r="10" variants={variants.circle} initial="initial" animate={controls} />
      <motion.path d="m9 12 2 2 4-4" variants={variants.path} initial="initial" animate={controls} />
    </motion.svg>
  );
});

function CircleCheck(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, CircleCheck, CircleCheck as CircleCheckIcon };
