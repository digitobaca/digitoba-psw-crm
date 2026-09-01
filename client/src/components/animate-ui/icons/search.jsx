'use client';

// Ported from Animate UI (https://animate-ui.com) — MIT License. See icon.jsx.
import * as React from 'react';
import { motion } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper } from '@/components/animate-ui/icons/icon.jsx';

const animations = {
  default: {
    group: {
      initial: { rotate: 0 },
      animate: { transformOrigin: 'bottom right', rotate: [0, 17, -10, 5, -1, 0], transition: { duration: 0.8, ease: 'easeInOut' } },
    },
    path: {},
    circle: {},
  },
  find: {
    group: {
      initial: { x: 0, y: 0 },
      animate: { x: [0, '-15%', 0, 0], y: [0, 0, '-15%', 0], transition: { duration: 1, ease: 'easeInOut' } },
    },
    path: {},
    circle: {},
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
      <motion.path d="m21 21-4.34-4.34" variants={variants.path} initial="initial" animate={controls} />
      <motion.circle cx={11} cy={11} r={8} variants={variants.circle} initial="initial" animate={controls} />
    </motion.svg>
  );
});

function Search(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, Search, Search as SearchIcon };
