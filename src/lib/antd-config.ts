// Ant Design Configuration for Mobile-First Approach
import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Mobile-first color scheme
    colorPrimary: '#06b6d4', // Cyan primary from current design
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // Typography for mobile readability
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // Spacing optimized for touch targets
    padding: 8,
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 12,
    paddingLG: 16,
    paddingXL: 20,
    paddingXXL: 24,

    // Border radius for modern look
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Control heights for mobile touch
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 48,

    // Screen size breakpoints (mobile-first)
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600,
  },
  components: {
    // Button component mobile optimizations
    Button: {
      controlHeight: 44, // Larger touch targets on mobile
      borderRadius: 8,
      fontSize: 14,
      paddingInline: 16,
    },

    // Input component mobile optimizations
    Input: {
      controlHeight: 44,
      borderRadius: 8,
      fontSize: 16, // Prevents zoom on iOS
      paddingInline: 12,
    },

    // Card component mobile optimizations
    Card: {
      borderRadius: 12,
      paddingLG: 16,
      paddingMD: 12,
      paddingSM: 8,
    },

    // Grid system responsive breakpoints
    Grid: {
      screenXS: 480,
      screenSM: 576,
      screenMD: 768,
      screenLG: 992,
      screenXL: 1200,
      screenXXL: 1600,
    },

    // Navigation mobile optimizations
    Menu: {
      fontSize: 14,
      itemHeight: 44, // Touch-friendly menu items
      itemPaddingInline: 16,
      borderRadius: 8,
    },

    // Table mobile optimizations
    Table: {
      fontSize: 12,
      padding: 8,
      headerBg: '#f8fafc',
      borderRadius: 8,
    },

    // Statistic component for dashboard metrics
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 20,
      fontFamily: '"Inter", sans-serif',
    },

    // Progress component for dashboards
    Progress: {
      radius: 50,
      textSizeSM: 10,
      textSize: 12,
    },

    // Modal mobile optimizations
    Modal: {
      paddingLG: 16,
      paddingMD: 12,
      borderRadius: 12,
    },

    // Form mobile optimizations
    Form: {
      itemMarginBottom: 16,
      labelFontSize: 14,
      labelHeight: 22,
    },
  },
};

// Responsive configuration object for different screen sizes
export const responsiveConfig = {
  // Mobile (default)
  mobile: {
    gridCols: 1,
    cardSize: 'small',
    fontSize: 14,
    spacing: 8,
  },

  // Tablet (sm, md)
  tablet: {
    gridCols: 2,
    cardSize: 'default',
    fontSize: 14,
    spacing: 12,
  },

  // Desktop (lg, xl, xxl)
  desktop: {
    gridCols: 3,
    cardSize: 'large',
    fontSize: 16,
    spacing: 16,
  },
};

// Helper function to get responsive config based on screen size
export const getResponsiveConfig = (screenSize: string) => {
  switch (screenSize) {
    case 'sm':
    case 'md':
      return responsiveConfig.tablet;
    case 'lg':
    case 'xl':
    case 'xxl':
      return responsiveConfig.desktop;
    default:
      return responsiveConfig.mobile;
  }
};