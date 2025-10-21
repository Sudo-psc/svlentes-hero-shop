'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Badge, Drawer } from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/use-media-query';

const { Header } = Layout;

interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className = '',
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Início',
    },
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
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

  const handleMenuClick = (key: string) => {
    setDrawerVisible(false);

    // Handle navigation based on key
    switch (key) {
      case 'home':
        window.location.href = '/';
        break;
      case 'dashboard':
        window.location.href = '/area-assinante';
        break;
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

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Header */}
      <Header className="bg-white shadow-sm px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
            className="text-gray-600 hover:text-cyan-600"
            size="large"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Badge count={3} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="text-gray-600 hover:text-cyan-600"
            />
          </Badge>

          {/* User Avatar */}
          <Avatar
            size="small"
            icon={<UserOutlined />}
            className="bg-cyan-600"
          />
        </div>
      </Header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={onClose}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
        width={280}
      >
        <Menu
          mode="vertical"
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          className="border-0"
        />
      </Drawer>
    </>
  );
};

// Bottom Tab Navigation for Mobile (alternative pattern)
export const MobileBottomNavigation: React.FC<{
  activeKey?: string;
  className?: string;
}> = ({ activeKey = 'home', className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const bottomMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Início',
    },
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Config',
    },
  ];

  if (!isMobile) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}>
      <Menu
        mode="horizontal"
        selectedKeys={[activeKey]}
        items={bottomMenuItems}
        className="flex justify-around border-0"
        onClick={({ key }) => {
          // Handle navigation
          switch (key) {
            case 'home':
              window.location.href = '/';
              break;
            case 'dashboard':
              window.location.href = '/area-assinante';
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
        }}
      />
    </div>
  );
};