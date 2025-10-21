'use client';

import React from 'react';
import { Layout, Card, Space, Typography } from 'antd';
import {
  ResponsiveGrid,
  ResponsiveCardGrid,
  FullWidthCol,
  HalfWidthCol,
  useResponsiveGrid
} from './responsive-grid';
import { MobileNavigation } from './mobile-navigation';
import { DesktopNavigation } from './desktop-navigation';
import { DashboardMetrics } from './dashboard-metrics';
import { DashboardHeader } from './dashboard-header';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showMetrics?: boolean;
  showNavigation?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Dashboard',
  subtitle,
  showMetrics = true,
  showNavigation = true,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveGrid();

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      {isMobile && showNavigation && <MobileNavigation />}

      {/* Desktop Sidebar Navigation */}
      {!isMobile && showNavigation && (
        <Sider
          width={isTablet ? 200 : 250}
          className="bg-white shadow-sm"
          breakpoint="lg"
          collapsedWidth={0}
          onBreakpoint={(broken) => {
            console.log(broken);
          }}
        >
          <DesktopNavigation />
        </Sider>
      )}

      {/* Main Content Area */}
      <Layout>
        {/* Dashboard Header */}
        <FullWidthCol>
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            isMobile={isMobile}
          />
        </FullWidthCol>

        {/* Dashboard Metrics */}
        {showMetrics && (
          <FullWidthCol>
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <DashboardMetrics isMobile={isMobile} />
            </div>
          </FullWidthCol>
        )}

        {/* Main Content */}
        <Content className="px-4 sm:px-6 lg:px-8 py-4">
          <ResponsiveGrid gutter={[16, 16]}>
            {children}
          </ResponsiveGrid>
        </Content>
      </Layout>
    </Layout>
  );
};

// Dashboard Content Wrapper for consistent spacing
export const DashboardContent: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  const { isMobile } = useResponsiveGrid();

  return (
    <Card
      className={`shadow-sm border-0 ${className}`}
      bodyStyle={{
        padding: isMobile ? '12px' : '16px',
      }}
    >
      {title && (
        <div className="mb-4">
          <Title level={4} className="m-0">
            {title}
          </Title>
        </div>
      )}
      {children}
    </Card>
  );
};

// Dashboard Section Wrapper
export const DashboardSection: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => {
  const { isMobile } = useResponsiveGrid();

  return (
    <div className={`mb-6 ${className}`}>
      <div className="mb-4">
        <Title level={3} className="m-0">
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" className="text-sm">
            {subtitle}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
};

// Responsive Chart Container
export const ResponsiveChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  height?: number;
  className?: string;
}> = ({ title, children, height = 300, className = '' }) => {
  const { isMobile } = useResponsiveGrid();

  return (
    <Card
      className={`shadow-sm border-0 ${className}`}
      title={title}
      bodyStyle={{
        padding: isMobile ? '12px' : '16px',
        height: isMobile ? height * 0.8 : height,
      }}
    >
      {children}
    </Card>
  );
};

// Responsive Data Table Container
export const ResponsiveTableContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  const { isMobile } = useResponsiveGrid();

  return (
    <Card
      className={`shadow-sm border-0 ${className}`}
      title={title}
      bodyStyle={{
        padding: isMobile ? '8px' : '16px',
      }}
    >
      <div className={isMobile ? 'overflow-x-auto' : ''}>
        {children}
      </div>
    </Card>
  );
};