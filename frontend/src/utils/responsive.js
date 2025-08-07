import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

/**
 * Responsive Breakpoint Utility Hook
 * Provides easy access to Material-UI breakpoints with custom logic
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  // All hook calls must be at the top level
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeMobile = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isSmallDesktop = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('xl'));
  const isCompact = useMediaQuery('(max-width: 600px)');
  const isWide = useMediaQuery('(min-width: 1400px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  const hasHover = useMediaQuery('(hover: hover)');
  
  // Helper function that uses the already computed values
  const getResponsiveValue = (values) => {
    const { xs, sm, md, lg, xl } = values;
    
    if (isXs && xs !== undefined) return xs;
    if (isSm && sm !== undefined) return sm;
    if (isMd && md !== undefined) return md;
    if (isLg && lg !== undefined) return lg;
    if (isXl && xl !== undefined) return xl;
    
    // Fallback to largest defined value
    return xl || lg || md || sm || xs;
  };
  
  return {
    // Standard Material-UI breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Common responsive queries
    isMobile, // xs, sm
    isTablet, // md
    isDesktop, // lg, xl
    
    // Specific size queries
    isSmallMobile, // xs only
    isLargeMobile, // sm only
    isSmallDesktop, // lg only
    isLargeDesktop, // xl only
    
    // Custom breakpoints for specific use cases
    isCompact, // Very small screens
    isWide, // Ultra-wide screens
    isLandscape,
    isPortrait,
    
    // Touch device detection
    isTouchDevice,
    hasHover,
    
    // Get responsive value based on current breakpoint
    getResponsiveValue
  };
};

/**
 * Responsive Container Component
 * Automatically adjusts padding and margins based on screen size
 */
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = 'lg',
  disableGutters = false,
  sx = {},
  ...props 
}) => {
  const responsive = useResponsive();
  
  const getResponsivePadding = () => {
    if (disableGutters) return 0;
    
    if (responsive.isXs) return 1;
    if (responsive.isSm) return 2;
    if (responsive.isMd) return 3;
    return 4;
  };
  
  return (
    <div
      style={{
        maxWidth: responsive.isMobile ? '100%' : 
                 maxWidth === 'xs' ? '444px' :
                 maxWidth === 'sm' ? '600px' :
                 maxWidth === 'md' ? '960px' :
                 maxWidth === 'lg' ? '1280px' :
                 maxWidth === 'xl' ? '1920px' : '100%',
        margin: '0 auto',
        padding: `0 ${getResponsivePadding() * 8}px`,
        width: '100%',
        ...sx
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Grid Component
 * Provides automatic responsive grid layout
 */
export const ResponsiveGrid = ({ 
  children, 
  spacing = 2, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  sx = {},
  ...props 
}) => {
  const responsive = useResponsive();
  
  const getCurrentColumns = () => {
    if (responsive.isXs) return columns.xs || 1;
    if (responsive.isSm) return columns.sm || columns.xs || 2;
    if (responsive.isMd) return columns.md || columns.sm || columns.xs || 3;
    if (responsive.isLg) return columns.lg || columns.md || columns.sm || columns.xs || 4;
    return columns.xl || columns.lg || columns.md || columns.sm || columns.xs || 4;
  };
  
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getCurrentColumns()}, 1fr)`,
        gap: `${spacing * 8}px`,
        ...sx
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Text Component
 * Automatically adjusts font size based on screen size
 */
export const ResponsiveText = ({ 
  variant = 'body1',
  component,
  children,
  responsiveVariant,
  sx = {},
  ...props 
}) => {
  const responsive = useResponsive();
  
  const getResponsiveVariant = () => {
    if (!responsiveVariant) return variant;
    
    if (responsive.isXs && responsiveVariant.xs) return responsiveVariant.xs;
    if (responsive.isSm && responsiveVariant.sm) return responsiveVariant.sm;
    if (responsive.isMd && responsiveVariant.md) return responsiveVariant.md;
    if (responsive.isLg && responsiveVariant.lg) return responsiveVariant.lg;
    if (responsive.isXl && responsiveVariant.xl) return responsiveVariant.xl;
    
    return variant;
  };
  
  return (
    <span
      style={{
        fontSize: 
          getResponsiveVariant() === 'h1' ? responsive.isMobile ? '2rem' : '3rem' :
          getResponsiveVariant() === 'h2' ? responsive.isMobile ? '1.75rem' : '2.5rem' :
          getResponsiveVariant() === 'h3' ? responsive.isMobile ? '1.5rem' : '2rem' :
          getResponsiveVariant() === 'h4' ? responsive.isMobile ? '1.25rem' : '1.75rem' :
          getResponsiveVariant() === 'h5' ? responsive.isMobile ? '1.125rem' : '1.5rem' :
          getResponsiveVariant() === 'h6' ? responsive.isMobile ? '1rem' : '1.25rem' :
          getResponsiveVariant() === 'body1' ? responsive.isMobile ? '0.875rem' : '1rem' :
          getResponsiveVariant() === 'body2' ? responsive.isMobile ? '0.75rem' : '0.875rem' :
          getResponsiveVariant() === 'caption' ? responsive.isMobile ? '0.7rem' : '0.75rem' :
          '1rem',
        lineHeight: responsive.isMobile ? 1.4 : 1.5,
        ...sx
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default useResponsive;
