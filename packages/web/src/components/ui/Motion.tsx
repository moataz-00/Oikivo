'use client';

import { motion, useInView, useSpring, useTransform, Variants } from 'framer-motion';
import { useRef, ReactNode, useEffect } from 'react';

// ─────────────────────────────────────────────
// FadeIn — fades + slides up when entering viewport
// ─────────────────────────────────────────────
interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({ children, className, delay = 0, duration = 0.5, y = 20 }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// StaggerContainer — staggers children animations
// ─────────────────────────────────────────────
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// StaggerItem — child of StaggerContainer
// ─────────────────────────────────────────────
const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// HoverCard — lifts on hover with shadow
// ─────────────────────────────────────────────
interface HoverCardProps {
  children: ReactNode;
  className?: string;
}

export function HoverCard({ children, className }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SlideIn — slides in from left or right
// ─────────────────────────────────────────────
interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  delay?: number;
}

export function SlideIn({ children, className, direction = 'left', delay = 0 }: SlideInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const x = direction === 'left' ? -40 : 40;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ScaleIn — scales up from 95% on viewport entry
// ─────────────────────────────────────────────
interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// FloatIn — floats up from slightly below with a spring
// ─────────────────────────────────────────────
interface FloatInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FloatIn({ children, className, delay = 0 }: FloatInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// PulseLoader — three animated dots loading indicator
// ─────────────────────────────────────────────
interface PulseLoaderProps {
  size?: number;
  color?: string;
}

export function PulseLoader({ size = 8, color = '#4f46e5' }: PulseLoaderProps) {
  const dotVariants: Variants = {
    initial: { scale: 0.6, opacity: 0.4 },
    animate: { scale: 1, opacity: 1 },
  };

  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'block' }}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// NumberTicker — animates counting up to a number
// ─────────────────────────────────────────────
interface NumberTickerProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function NumberTicker({ value, className, prefix = '', suffix = '', decimals = 0 }: NumberTickerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
