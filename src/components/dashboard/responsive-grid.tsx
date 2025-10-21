'use client';

import React from 'react';
import { Row, Col, Grid } from 'antd';
import { useBreakpoint } from 'antd';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ResponsiveGridProps {
  children: React.ReactNode;
  gutter?: [number, number] | number;
  className?: string;
}

interface ResponsiveColProps {
  children: React.ReactNode;
  xs?: number | { span: number; offset?: number; push?: number; pull?: number };
  sm?: number | { span: number; offset?: number; push?: number; pull?: number };
  md?: number | { span: number; offset?: number; push?: number; pull?: number };
  lg?: number | { span: number; offset?: number; push?: number; pull?: number };
  xl?: number | { span: number; offset?: number; push?: number; pull?: number };
  xxl?: number | { span: number; offset?: number; push?: number; pull?: number };
  className?: string;
}

// Responsive Grid Component with mobile-first approach
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  gutter = [16, 16],
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const screens = useBreakpoint();

  // Adjust gutter based on screen size
  const responsiveGutter = React.useMemo(() => {
    if (isMobile) return [8, 8];
    if (isTablet) return [12, 12];
    return gutter;
  }, [isMobile, isTablet, gutter]);

  return (
    <Row gutter={responsiveGutter} className={className}>
      {children}
    </Row>
  );
};

// Responsive Column Component
export const ResponsiveCol: React.FC<ResponsiveColProps> = ({
  children,
  xs = 24, // Mobile: full width
  sm = 24, // Small tablet: full width
  md = 12, // Tablet: half width
  lg = 8,  // Desktop: one-third
  xl = 6,  // Large desktop: one-quarter
  xxl = 6, // Extra large: one-quarter
  className = '',
}) => {
  return (
    <Col
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      className={className}
    >
      {children}
    </Col>
  );
};

// Responsive Card Grid for dashboard widgets
export const ResponsiveCardGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  return (
    <ResponsiveGrid gutter={isMobile ? [8, 8] : isTablet ? [12, 12] : [16, 16]} className={className}>
      {React.Children.map(children, (child, index) => (
        <ResponsiveCol
          key={index}
          xs={24}
          sm={24}
          md={12}
          lg={8}
          xl={6}
          xxl={6}
        >
          {child}
        </ResponsiveCol>
      ))}
    </ResponsiveGrid>
  );
};

// Full-width responsive column
export const FullWidthCol: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} className={className}>
      {children}
    </Col>
  );
};

// Half-width responsive column (for charts and tables)
export const HalfWidthCol: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} className={className}>
      {children}
    </Col>
  );
};

// Two-thirds width responsive column
export const TwoThirdsCol: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <Col xs={24} sm={24} md={16} lg={16} xl={16} xxl={16} className={className}>
      {children}
    </Col>
  );
};

// One-third width responsive column
export const OneThirdCol: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} className={className}>
      {children}
    </Col>
  );
};

// Export a hook for responsive grid utilities
export const useResponsiveGrid = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    getColSpan: (mobile: number, tablet: number, desktop: number) => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
    getGutter: () => {
      if (isMobile) return [8, 8];
      if (isTablet) return [12, 12];
      return [16, 16];
    },
  };
};