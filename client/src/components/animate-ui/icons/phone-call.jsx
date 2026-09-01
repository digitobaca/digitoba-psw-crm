'use client';

// Ported from Animate UI (https://animate-ui.com) — MIT License. See icon.jsx.
import * as React from 'react';
import { motion } from 'motion/react';
import { getVariants, useAnimateIconContext, IconWrapper } from '@/components/animate-ui/icons/icon.jsx';

const animations = {
  default: (() => {
    const animation = { phone: {} };

    for (let i = 1; i <= 2; i++) {
      animation[`wave${i}`] = {
        initial: { opacity: 1, scale: 1 },
        animate: {
          opacity: 0,
          scale: 0,
          transition: {
            opacity: {
              duration: 0.2,
              ease: 'easeInOut',
              repeat: 1,
              repeatType: 'reverse',
              repeatDelay: 0.2,
              delay: 0.2 * (i - 1),
            },
            scale: {
              duration: 0.2,
              ease: 'easeInOut',
              repeat: 1,
              repeatType: 'reverse',
              repeatDelay: 0.2,
              delay: 0.2 * (i - 1),
            },
          },
        },
      };
    }

    return animation;
  })(),
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
      {/* Waves (inner first, then outer with delay) */}
      <motion.path d="M13 6a5 5 0 0 1 5 5" variants={variants.wave1} initial="initial" animate={controls} />
      <motion.path d="M13 2a9 9 0 0 1 9 9" variants={variants.wave2} initial="initial" animate={controls} />
      {/* Phone body */}
      <motion.path
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        variants={variants.phone}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
});

function PhoneCall(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, PhoneCall, PhoneCall as PhoneCallIcon };
