'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'bounce' | 'rotate' | 'scale' | 'pulse' | 'shake';
}

const animations = {
  bounce: {
    hover: { y: [0, -4, 0], transition: { duration: 0.4 } },
  },
  rotate: {
    hover: { rotate: 360, transition: { duration: 0.6 } },
  },
  scale: {
    hover: { scale: 1.2, transition: { duration: 0.2 } },
  },
  pulse: {
    hover: {
      scale: [1, 1.1, 1],
      transition: { repeat: Infinity, duration: 0.8 },
    },
  },
  shake: {
    hover: {
      x: [0, -2, 2, -2, 2, 0],
      transition: { duration: 0.4 },
    },
  },
};

export function AnimatedIcon({ children, className, animation = 'scale' }: AnimatedIconProps) {
  return (
    <motion.div className={cn('inline-flex', className)} whileHover={animations[animation].hover}>
      {children}
    </motion.div>
  );
}
