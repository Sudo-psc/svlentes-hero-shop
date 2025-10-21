'use client';

import React from 'react';
import { Layout, Menu, Avatar, Typography, Space, Divider, Button } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/use-media-query';

const { Sider } = Layout;
const { Text } = Typography;

interface DesktopNavigationProps {
  collapsed?: boolean;
  className?: string;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  collapsed = false,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  if (isMobile) return null;

  const menuItems = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'subscription',
      icon: <FileTextOutlined />,
      label: 'Assinatura',
      children: [
        {
          key: 'subscription-details',
          label: 'Detalhes',
        },
        {
          key: 'subscription-invoices',
          label: 'Faturas',
        },
        {
          key: 'subscription-deliveries',
          label: 'Entregas',
        },
      ],
    },
    {
      key: 'appointments',
      icon: <CalendarOutlined />,
      label: 'Consultas',
    },
    {
      key: 'payments',
      icon: <CreditCardOutlined />,
      label: 'Pagamentos',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    // Handle navigation
    switch (key) {
      case 'dashboard':
        window.location.href = '/area-assinante';
        break;
      case 'subscription-details':
        window.location.href = '/area-assinante/assinatura';
        break;
      case 'subscription-invoices':
        window.location.href = '/area-assinante/faturas';
        break;
      case 'subscription-deliveries':
        window.location.href = '/area-assinante/entregas';
        break;
      case 'appointments':
        window.location.href = '/area-assinante/consultas';
        break;
      case 'payments':
        window.location.href = '/area-assinante/pagamentos';
        break;
      case 'profile':
        window.location.href = '/area-assinante/perfil';
        break;
      case 'settings':
        window.location.href = '/area-assinante/configuracoes';
        break;
      default:
        break;
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Logo/Brand Area */}
      <div className="p-4 border-b border-gray-200">
        {!collapsed ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SV</span>
            </div>
            <Text strong className="text-gray-800">SV Lentes</Text>
            <br />
            <Text type="secondary" className="text-xs">
              Portal Assinante
            </Text>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-white font-bold text-sm">SV</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-auto">
        <Menu
          mode="inline"
          selectedKeys={['dashboard']}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-0 h-full"
          inlineCollapsed={collapsed}
        />
      </div>

      {/* User Section */}
      {!collapsed && (
        <div className="border-t border-gray-200 p-4">
          <Space direction="vertical" className="w-full" size="small">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              <Avatar size="small" icon={<UserOutlined />} className="bg-cyan-600" />
              <div className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-gray-800 block truncate">
                  João Silva
                </Text>
                <Text type="secondary" className="text-xs block">
                  Assinante Ativo
                </Text>
              </div>
            </div>

            <Divider className="my-2" />

            {/* Quick Actions */}
            <Space className="w-full">
              <Button
                type="text"
                icon={<BellOutlined />}
                size="small"
                className="flex-1 text-gray-600 hover:text-cyan-600"
              />
              <Button
                type="text"
                icon={<LogoutOutlined />}
                size="small"
                className="flex-1 text-gray-600 hover:text-red-600"
              />
            </Space>
          </Space>
        </div>
      )}
    </div>
  );
};