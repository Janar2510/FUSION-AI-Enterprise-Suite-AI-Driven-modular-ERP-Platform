/**
 * FusionAI Design System Tokens
 *
 * This file documents the design system for the FusionAI Enterprise Suite.
 * All UI components should follow these tokens for consistency.
 *
 * Design Principles:
 * - Glassmorphism UI with amber/orange accent colors
 * - Framer Motion for smooth animations
 * - Dark theme with high contrast for readability
 */

// Color Palette
export const colors = {
  // Primary - Amber (main brand color)
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main brand color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  // Secondary - Orange (accent)
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main accent
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  // Accent - Teal (success/status)
  accent: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  // Dark theme
  dark: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#1a2035',
    800: '#111827',
    900: '#0a0f1e', // Base background
    950: '#060b15',
  },
  // Glass effect
  glass: {
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.07)',
    hover: 'rgba(255, 255, 255, 0.06)',
    active: 'rgba(245, 158, 11, 0.15)',
  },
} as const;

// Animation Tokens
export const animations = {
  // Standard hover animation
  hover: {
    scale: 1.02,
    y: -2,
  },
  // Standard tap animation
  tap: {
    scale: 0.98,
  },
  // Spring transition defaults
  spring: {
    stiffness: 400,
    damping: 25,
  },
  // Duration constants
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

// Spacing Scale
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

// Border Radius Scale
export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

// Shadow Scale
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
  glow: '0 0 20px rgba(245, 158, 11, 0.35)',
  'glow-lg': '0 0 40px rgba(245, 158, 11, 0.45)',
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const;

// Re-export for convenience
export const tokens = {
  colors,
  animations,
  spacing,
  radius,
  shadows,
  typography,
};

export default tokens;