'use client';

import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { antdTheme } from '@/lib/antd-config';
import { useMediaQuery } from '@/hooks/use-media-query';

interface AntdProviderProps {
  children: React.ReactNode;
}

export const AntdProvider: React.FC<AntdProviderProps> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Adjust theme based on device
  const deviceTheme = React.useMemo(() => {
    if (isMobile) {
      return {
        ...antdTheme,
        token: {
          ...antdTheme.token,
          fontSize: 14,
          controlHeight: 44, // Larger touch targets
          padding: 8,
        },
      };
    }

    if (isTablet) {
      return {
        ...antdTheme,
        token: {
          ...antdTheme.token,
          fontSize: 14,
          controlHeight: 40,
          padding: 12,
        },
      };
    }

    // Desktop
    return antdTheme;
  }, [isMobile, isTablet]);

  return (
    <ConfigProvider theme={deviceTheme}>
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  );
};