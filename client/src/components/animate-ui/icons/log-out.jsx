'use client';

// Ported from Animate UI (https://animate-ui.com) — MIT License. See icon.jsx.
import * as React from 'react';
import { motion } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper } from '@/components/animate-ui/icons/icon.jsx';

const animations = {
  default: {
    group: {
      initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { x: 2, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  },
  'default-loop': {
    group: {
      initial: { x: 0 },
      animate: { x: [0, 2, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
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
      <motion.g variants={variants.group} initial="initial" animate={controls}>
        <motion.path d="m16 17 5-5-5-5" variants={variants.path1} initial="initial" animate={controls} />
        <motion.path d="M21 12H9" variants={variants.path2} initial="initial" animate={controls} />
      </motion.g>
      <motion.path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" variants={variants.path3} initial="initial" animate={controls} />
    </motion.svg>
  );
});

function LogOut(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, LogOut, LogOut as LogOutIcon };
