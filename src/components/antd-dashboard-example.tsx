'use client';

import React from 'react';
import { AntdProvider } from '@/components/antd-provider';
import {
  DashboardLayout,
  DashboardContent,
  ResponsiveChartContainer,
} from '@/components/dashboard/dashboard-layout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ResponsiveGrid, ResponsiveCol, HalfWidthCol } from '@/components/dashboard/responsive-grid';
import {
  ResponsiveLineChart,
  ResponsiveBarChart,
  ResponsivePieChart,
  ResponsiveDoughnutChart,
  ResponsiveRadarChart,
  ChartContainer,
  generateSampleData,
} from '@/components/dashboard/responsive-charts';
import { SubscriptionTable } from '@/components/dashboard/dashboard-data-table';
import { Button, Space, Card, Typography, Tabs } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { TabPane } = Tabs;

// Sample data for demonstration
const sampleData = generateSampleData();
const sampleSubscriptionData = [
  {
    id: 1,
    customer: 'João Silva',
    plan: 'Mensal',
    status: 'active',
    nextDelivery: '2025-01-25',
    value: '89.90',
  },
  {
    id: 2,
    customer: 'Maria Santos',
    plan: 'Trimestral',
    status: 'active',
    nextDelivery: '2025-01-28',
    value: '249.90',
  },
  {
    id: 3,
    customer: 'Pedro Costa',
    plan: 'Mensal',
    status: 'pending',
    nextDelivery: '2025-01-30',
    value: '89.90',
  },
  {
    id: 4,
    customer: 'Ana Oliveira',
    plan: 'Semestral',
    status: 'active',
    nextDelivery: '2025-02-01',
    value: '449.90',
  },
  {
    id: 5,
    customer: 'Carlos Ferreira',
    plan: 'Anual',
    status: 'active',
    nextDelivery: '2025-02-05',
    value: '799.90',
  },
];

export const AntDDashboardExample: React.FC = () => {
  return (
    <AntdProvider>
      <DashboardLayout
        title="Dashboard Administrativo"
        subtitle="Visão geral e análise de dados"
        showMetrics={true}
        showNavigation={true}
      >
        {/* Dashboard Tabs */}
        <Tabs defaultActiveKey="overview" className="mb-6">
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Visão Geral
              </span>
            }
            key="overview"
          >
            {/* Overview Tab Content */}
            <ResponsiveGrid gutter={[16, 16]}>
              {/* Revenue Chart */}
              <HalfWidthCol>
                <ChartContainer title="Receita Mensal">
                  <ResponsiveLineChart
                    title=""
                    data={sampleData.monthlyRevenue}
                    height={250}
                  />
                </ChartContainer>
              </HalfWidthCol>

              {/* Subscription Types Chart */}
              <HalfWidthCol>
                <ChartContainer title="Tipos de Assinatura">
                  <ResponsiveDoughnutChart
                    title=""
                    data={sampleData.subscriptionTypes}
                    height={250}
                  />
                </ChartContainer>
              </HalfWidthCol>

              {/* Customer Growth Chart */}
              <HalfWidthCol>
                <ChartContainer title="Crescimento de Clientes">
                  <ResponsiveBarChart
                    title=""
                    data={sampleData.customerMetrics}
                    height={250}
                  />
                </ChartContainer>
              </HalfWidthCol>

              {/* Performance Metrics */}
              <HalfWidthCol>
                <ChartContainer title="Métricas de Desempenho">
                  <ResponsiveRadarChart
                    title=""
                    data={{
                      labels: ['Vendas', 'Suporte', 'Entrega', 'Qualidade', 'Satisfação', 'Retenção'],
                      datasets: [{
                        label: 'Atual',
                        data: [85, 78, 92, 88, 95, 82],
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#fff',
                      }],
                    }}
                    height={250}
                  />
                </ChartContainer>
              </HalfWidthCol>
            </ResponsiveGrid>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                Assinaturas
              </span>
            }
            key="subscriptions"
          >
            {/* Subscriptions Tab Content */}
            <SubscriptionTable
              dataSource={sampleSubscriptionData}
              loading={false}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Relatórios
              </span>
            }
            key="reports"
          >
            {/* Reports Tab Content */}
            <ResponsiveGrid gutter={[16, 16]}>
              <ResponsiveCol xs={24} sm={24} md={12} lg={8} xl={8} xxl={8}>
                <Card className="shadow-sm border-0">
                  <Title level={4} className="text-center text-cyan-600">
                    Relatório Mensal
                  </Title>
                  <p className="text-gray-600 text-center mb-4">
                    Análise completa de desempenho
                  </p>
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 border-cyan-600"
                    >
                      Baixar PDF
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      className="w-full"
                    >
                      Baixar Excel
                    </Button>
                  </Space>
                </Card>
              </ResponsiveCol>

              <ResponsiveCol xs={24} sm={24} md={12} lg={8} xl={8} xxl={8}>
                <Card className="shadow-sm border-0">
                  <Title level={4} className="text-center text-green-600">
                    Relatório de Clientes
                  </Title>
                  <p className="text-gray-600 text-center mb-4">
                    Análise de base de clientes
                  </p>
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      className="w-full bg-green-600 hover:bg-green-700 border-green-600"
                    >
                      Baixar PDF
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      className="w-full"
                    >
                      Baixar Excel
                    </Button>
                  </Space>
                </Card>
              </ResponsiveCol>

              <ResponsiveCol xs={24} sm={24} md={12} lg={8} xl={8} xxl={8}>
                <Card className="shadow-sm border-0">
                  <Title level={4} className="text-center text-purple-600">
                    Relatório Financeiro
                  </Title>
                  <p className="text-gray-600 text-center mb-4">
                    Análise financeira detalhada
                  </p>
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      className="w-full bg-purple-600 hover:bg-purple-700 border-purple-600"
                    >
                      Baixar PDF
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      className="w-full"
                    >
                      Baixar Excel
                    </Button>
                  </Space>
                </Card>
              </ResponsiveCol>
            </ResponsiveGrid>
          </TabPane>
        </Tabs>

        {/* Quick Actions */}
        <ResponsiveGrid gutter={[16, 16]} className="mt-6">
          <ResponsiveCol xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <Card className="shadow-sm border-0">
              <Title level={4} className="m-0 mb-4">
                Ações Rápidas
              </Title>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="bg-cyan-600 hover:bg-cyan-700 border-cyan-600"
                >
                  Nova Assinatura
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  className="text-gray-600 border-gray-300 hover:text-cyan-600 hover:border-cyan-600"
                >
                  Exportar Relatório
                </Button>
                <Button
                  icon={<FilterOutlined />}
                  className="text-gray-600 border-gray-300 hover:text-cyan-600 hover:border-cyan-600"
                >
                  Filtros Avançados
                </Button>
              </Space>
            </Card>
          </ResponsiveCol>
        </ResponsiveGrid>

        {/* Additional Stats Cards */}
        <ResponsiveGrid gutter={[16, 16]} className="mt-6">
          <ResponsiveCol xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <Card className="shadow-sm border-0 text-center">
              <Title level={3} className="m-0 text-cyan-600">
                R$ 12.450
              </Title>
              <p className="text-gray-600 text-sm mt-1">
                Receita Total
              </p>
            </Card>
          </ResponsiveCol>

          <ResponsiveCol xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <Card className="shadow-sm border-0 text-center">
              <Title level={3} className="m-0 text-green-600">
                +23%
              </Title>
              <p className="text-gray-600 text-sm mt-1">
                Crescimento Mensal
              </p>
            </Card>
          </ResponsiveCol>

          <ResponsiveCol xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <Card className="shadow-sm border-0 text-center">
              <Title level={3} className="m-0 text-orange-600">
                156
              </Title>
              <p className="text-gray-600 text-sm mt-1">
                Clientes Ativos
              </p>
            </Card>
          </ResponsiveCol>

          <ResponsiveCol xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <Card className="shadow-sm border-0 text-center">
              <Title level={3} className="m-0 text-purple-600">
                92%
              </Title>
              <p className="text-gray-600 text-sm mt-1">
                Satisfação
              </p>
            </Card>
          </ResponsiveCol>
        </ResponsiveGrid>
      </DashboardLayout>
    </AntdProvider>
  );
};