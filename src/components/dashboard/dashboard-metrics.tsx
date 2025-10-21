'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Space, Typography } from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  CalendarOutlined,
  DollarOutlined,
  TrendingUpOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { ResponsiveGrid, ResponsiveCol } from './responsive-grid';
import { useMediaQuery } from '@/hooks/use-media-query';

const { Text } = Typography;

interface MetricCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  icon,
  trend,
  color = '#06b6d4',
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Card
      className={`shadow-sm border-0 hover:shadow-md transition-shadow ${className}`}
      bodyStyle={{
        padding: isMobile ? '12px' : '16px',
      }}
    >
      <Space direction="vertical" size="small" className="w-full">
        {/* Header with Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                {React.cloneElement(icon as React.ReactElement, {
                  style: { color },
                  className: 'text-sm',
                })}
              </div>
            )}
            <Text className="text-gray-600 text-sm font-medium">{title}</Text>
          </div>
        </div>

        {/* Main Value */}
        <Statistic
          value={value}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{
            color: color,
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold',
          }}
        />

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center space-x-1">
            <TrendingUpOutlined
              className={`text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
              style={{
                transform: trend.isPositive ? 'none' : 'rotate(180deg)',
              }}
            />
            <Text
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </Text>
            <Text type="secondary" className="text-xs">
              vs. mês anterior
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

interface ProgressCardProps {
  title: string;
  percent: number;
  status?: 'normal' | 'success' | 'exception';
  format?: (percent?: number) => React.ReactNode;
  className?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  percent,
  status = 'normal',
  format,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Card
      className={`shadow-sm border-0 hover:shadow-md transition-shadow ${className}`}
      bodyStyle={{
        padding: isMobile ? '12px' : '16px',
      }}
    >
      <Space direction="vertical" size="small" className="w-full">
        <Text className="text-gray-600 text-sm font-medium">{title}</Text>
        <Progress
          type="dashboard"
          percent={percent}
          size={isMobile ? 80 : 100}
          status={status}
          format={format}
          strokeColor={{
            '0%': '#06b6d4',
            '100%': '#22c55e',
          }}
        />
      </Space>
    </Card>
  );
};

interface DashboardMetricsProps {
  isMobile?: boolean;
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  isMobile = false,
  className = '',
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 575px)');

  return (
    <div className={className}>
      <ResponsiveGrid gutter={[16, 16]}>
        {/* Monthly Subscription Revenue */}
        <ResponsiveCol xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
          <MetricCard
            title="Receita Mensal"
            value="R$ 2.450"
            prefix={<DollarOutlined />}
            icon={<DollarOutlined />}
            color="#22c55e"
            trend={{
              value: 12.5,
              isPositive: true,
            }}
          />
        </ResponsiveCol>

        {/* Active Subscriptions */}
        <ResponsiveCol xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
          <MetricCard
            title="Assinaturas Ativas"
            value={156}
            prefix={<UserOutlined />}
            icon={<UserOutlined />}
            color="#06b6d4"
            trend={{
              value: 8.2,
              isPositive: true,
            }}
          />
        </ResponsiveCol>

        {/* Scheduled Appointments */}
        <ResponsiveCol xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
          <MetricCard
            title="Consultas Agendadas"
            value={23}
            prefix={<CalendarOutlined />}
            icon={<CalendarOutlined />}
            color="#f59e0b"
            trend={{
              value: 3.1,
              isPositive: false,
            }}
          />
        </ResponsiveCol>

        {/* Conversion Rate */}
        <ResponsiveCol xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
          <MetricCard
            title="Taxa de Conversão"
            value="68.5%"
            prefix={<TrendingUpOutlined />}
            icon={<EyeOutlined />}
            color="#8b5cf6"
            trend={{
              value: 5.7,
              isPositive: true,
            }}
          />
        </ResponsiveCol>
      </ResponsiveGrid>

      {/* Progress Metrics Row */}
      <ResponsiveGrid gutter={[16, 16]} className="mt-4">
        {/* Delivery Progress */}
        <ResponsiveCol xs={24} sm={12} md={8} lg={8} xl={8} xxl={8}>
          <ProgressCard
            title="Progresso de Entrega"
            percent={75}
            status="normal"
            format={(percent) => `${percent}%`}
          />
        </ResponsiveCol>

        {/* Customer Satisfaction */}
        <ResponsiveCol xs={24} sm={12} md={8} lg={8} xl={8} xxl={8}>
          <ProgressCard
            title="Satisfação do Cliente"
            percent={92}
            status="success"
            format={(percent) => `${percent}%`}
          />
        </ResponsiveCol>

        {/* Inventory Status */}
        <ResponsiveCol xs={24} sm={12} md={8} lg={8} xl={8} xxl={8}>
          <ProgressCard
            title="Status do Estoque"
            percent={45}
            status="exception"
            format={(percent) => `${percent}%`}
          />
        </ResponsiveCol>
      </ResponsiveGrid>
    </div>
  );
};

// Quick Stats Component for Dashboard Overview
export const QuickStats: React.FC<{
  data: Array<{
    label: string;
    value: string | number;
    change?: number;
  }>;
  className?: string;
}> = ({ data, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Row gutter={[16, 16]} className={className}>
      {data.map((item, index) => (
        <Col xs={24} sm={12} md={6} lg={6} xl={6} key={index}>
          <Card className="shadow-sm border-0">
            <Space direction="vertical" size="small" className="w-full">
              <Text className="text-gray-600 text-sm">{item.label}</Text>
              <Statistic
                value={item.value}
                valueStyle={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 'bold',
                  color: '#06b6d4',
                }}
              />
              {item.change !== undefined && (
                <Text
                  className={`text-xs ${
                    item.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change)}%
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};