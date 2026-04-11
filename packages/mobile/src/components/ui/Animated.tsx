import React from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';

interface AnimatedContainerProps extends ViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

/** Fade in from bottom — good for page content */
export function FadeInView({
  delay = 0,
  duration = 400,
  children,
  ...props
}: AnimatedContainerProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

/** Fade in from top */
export function FadeInTopView({
  delay = 0,
  duration = 400,
  children,
  ...props
}: AnimatedContainerProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

/** Simple fade in (no movement) */
export function FadeView({
  delay = 0,
  duration = 400,
  children,
  ...props
}: AnimatedContainerProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

/** Slide in from right — good for list items */
export function SlideInView({
  delay = 0,
  duration = 400,
  children,
  ...props
}: AnimatedContainerProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(delay).duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

/** Scale in — good for icons, badges */
export function ScaleInView({
  delay = 0,
  duration = 400,
  children,
  ...props
}: AnimatedContainerProps) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(duration)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

interface StaggerContainerProps extends ViewProps {
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  children: React.ReactNode;
}

/** Wraps children with staggered FadeInDown animations */
export function StaggerContainer({
  staggerDelay = 80,
  baseDelay = 0,
  duration = 400,
  children,
  ...props
}: StaggerContainerProps) {
  return (
    <Animated.View {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <Animated.View
            entering={FadeInDown.delay(baseDelay + index * staggerDelay).duration(duration)}
          >
            {child}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}
