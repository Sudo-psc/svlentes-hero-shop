'use client';

import React from 'react';
import { Typography, Button, Space, Avatar, Badge, Dropdown } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/use-media-query';

const { Title, Text } = Typography;

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  isMobile?: boolean;
  showUserMenu?: boolean;
  showNotifications?: boolean;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Dashboard',
  subtitle,
  isMobile = false,
  showUserMenu = true,
  showNotifications = true,
  className = '',
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 575px)');

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Meu Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        window.location.href = '/area-assinante/perfil';
        break;
      case 'settings':
        window.location.href = '/area-assinante/configuracoes';
        break;
      case 'logout':
        // Handle logout
        console.log('Logout clicked');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`bg-white shadow-sm ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <Title
              level={isMobile ? 3 : 2}
              className={`m-0 text-gray-800 ${
                isSmallScreen ? 'text-lg' : isMobile ? 'text-xl' : 'text-2xl'
              }`}
            >
              {title}
            </Title>
            {subtitle && (
              <Text
                type="secondary"
                className={`block mt-1 ${
                  isSmallScreen ? 'text-xs' : 'text-sm'
                }`}
              >
                {subtitle}
              </Text>
            )}
          </div>

          {/* Actions Section */}
          {showUserMenu || showNotifications ? (
            <div className="flex items-center space-x-3 ml-4">
              {/* Notifications */}
              {showNotifications && (
                <Badge count={3} size="small">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    className="text-gray-600 hover:text-cyan-600"
                    size={isMobile ? 'small' : 'middle'}
                  />
                </Badge>
              )}

              {/* User Menu */}
              {showUserMenu && (
                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleUserMenuClick,
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    className="flex items-center space-x-2 text-gray-600 hover:text-cyan-600 px-2"
                    size={isMobile ? 'small' : 'middle'}
                  >
                    <Avatar
                      size={isMobile ? 'small' : 'default'}
                      icon={<UserOutlined />}
                      className="bg-cyan-600"
                    />
                    {!isMobile && (
                      <span className="text-sm font-medium hidden sm:inline">
                        João Silva
                      </span>
                    )}
                  </Button>
                </Dropdown>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Breadcrumb Component for Dashboard Navigation
export const DashboardBreadcrumb: React.FC<{
  items: Array<{
    title: string;
    href?: string;
  }>;
  className?: string;
}> = ({ items, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-gray-400">/</span>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="text-gray-600 hover:text-cyan-600 transition-colors"
                >
                  {item.title}
                </a>
              ) : (
                <span className="text-gray-800 font-medium">{item.title}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

// Page Header Component for Sub-pages
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: Array<{
    title: string;
    href?: string;
  }>;
  className?: string;
}> = ({ title, subtitle, actions, breadcrumb, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className={`bg-white shadow-sm ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb && <DashboardBreadcrumb items={breadcrumb} />}

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <Title
              level={isMobile ? 3 : 2}
              className={`m-0 text-gray-800 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}
            >
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" className="block mt-1 text-sm">
                {subtitle}
              </Text>
            )}
          </div>

          {actions && (
            <div className={`mt-4 sm:mt-0 sm:ml-4 flex flex-wrap gap-2 ${isMobile ? 'justify-start' : 'justify-end'}`}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};