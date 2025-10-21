'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Space, Tag, Input, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ResponsiveGrid, FullWidthCol, HalfWidthCol } from './responsive-grid';

const { RangePicker } = DatePicker;

interface DashboardTableProps {
  title: string;
  dataSource: any[];
  columns: ColumnsType<any>;
  loading?: boolean;
  pagination?: any;
  scroll?: any;
  className?: string;
}

// Mobile-optimized table wrapper
export const ResponsiveTable: React.FC<DashboardTableProps> = ({
  title,
  dataSource,
  columns,
  loading = false,
  pagination,
  scroll,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const [filteredData, setFilteredData] = useState(dataSource);

  // Responsive scroll configuration
  const responsiveScroll = React.useMemo(() => {
    if (isMobile) {
      return { x: 'max-content', y: 400 };
    }
    if (isTablet) {
      return { x: 'max-content', y: 500 };
    }
    return scroll || { x: 'max-content' };
  }, [isMobile, isTablet, scroll]);

  // Responsive pagination
  const responsivePagination = React.useMemo(() => {
    if (isMobile) {
      return {
        pageSize: 5,
        showSizeChanger: false,
        showTotal: (total: number) => `${total} itens`,
        simple: true,
      };
    }
    return {
      pageSize: 10,
      showSizeChanger: true,
      showTotal: (total: number, range: [number, number]) =>
        `${range[0]}-${range[1]} de ${total} itens`,
      pageSizeOptions: ['10', '20', '50', '100'],
      ...pagination,
    };
  }, [isMobile, pagination]);

  // Responsive column configuration
  const responsiveColumns = React.useMemo(() => {
    return columns.map(col => ({
      ...col,
      ellipsis: isMobile ? true : col.ellipsis,
      width: isMobile ? col.width || 120 : col.width,
    }));
  }, [isMobile, columns]);

  return (
    <Card
      className={`shadow-sm border-0 ${className}`}
      title={title}
      extra={
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            size={isMobile ? 'small' : 'middle'}
            className="text-gray-600 hover:text-cyan-600"
          />
          <Button
            type="text"
            icon={<FilterOutlined />}
            size={isMobile ? 'small' : 'middle'}
            className="text-gray-600 hover:text-cyan-600"
          />
        </Space>
      }
    >
      <Table
        columns={responsiveColumns}
        dataSource={filteredData}
        loading={loading}
        pagination={responsivePagination}
        scroll={responsiveScroll}
        size={isMobile ? 'small' : 'middle'}
        className="custom-table"
        rowKey="id"
      />
    </Card>
  );
};

// Mobile Card View for table data
export const MobileCardView: React.FC<{
  data: any[];
  renderCard: (item: any) => React.ReactNode;
  loading?: boolean;
  className?: string;
}> = ({ data, renderCard, loading = false, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {loading ? (
        // Loading skeleton
        Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} loading size="small" />
        ))
      ) : (
        data.map((item, index) => (
          <Card key={index} size="small" className="shadow-sm">
            {renderCard(item)}
          </Card>
        ))
      )}
    </div>
  );
};

// Search and Filter Component
export const TableFilters: React.FC<{
  onSearch: (value: string) => void;
  onFilter: (filters: any) => void;
  showDateRange?: boolean;
  showStatus?: boolean;
  className?: string;
}> = ({
  onSearch,
  onFilter,
  showDateRange = false,
  showStatus = false,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Card className={`shadow-sm border-0 mb-4 ${className}`}>
      <ResponsiveGrid gutter={[12, 12]}>
        {/* Search Input */}
        <FullWidthCol>
          <Input
            placeholder="Buscar..."
            prefix={<SearchOutlined />}
            onChange={(e) => onSearch(e.target.value)}
            size={isMobile ? 'small' : 'middle'}
            allowClear
          />
        </FullWidthCol>

        {/* Date Range Filter */}
        {showDateRange && (
          <FullWidthCol>
            <RangePicker
              style={{ width: '100%' }}
              size={isMobile ? 'small' : 'middle'}
              placeholder={['Data Inicial', 'Data Final']}
            />
          </FullWidthCol>
        )}

        {/* Status Filter */}
        {showStatus && (
          <FullWidthCol>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              size={isMobile ? 'small' : 'middle'}
              allowClear
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' },
                { value: 'pending', label: 'Pendente' },
              ]}
              onChange={(value) => onFilter({ status: value })}
            />
          </FullWidthCol>
        )}
      </ResponsiveGrid>
    </Card>
  );
};

// Sample subscription data table
export const SubscriptionTable: React.FC<{
  dataSource: any[];
  loading?: boolean;
}> = ({ dataSource, loading = false }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const columns: ColumnsType<any> = [
    {
      title: 'Cliente',
      dataIndex: 'customer',
      key: 'customer',
      render: (text, record) => (
        <Space>
          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {record.customer.charAt(0)}
            </span>
          </div>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Plano',
      dataIndex: 'plan',
      key: 'plan',
      render: (text) => (
        <Tag color="cyan">{text}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: 'Ativa' },
          inactive: { color: 'red', text: 'Inativa' },
          pending: { color: 'orange', text: 'Pendente' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Próxima Entrega',
      dataIndex: 'nextDelivery',
      key: 'nextDelivery',
    },
    {
      title: 'Valor',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `R$ ${value}`,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            className="text-gray-600 hover:text-cyan-600"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            className="text-gray-600 hover:text-cyan-600"
          />
        </Space>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (item: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {item.customer.charAt(0)}
            </span>
          </div>
          <span className="font-medium">{item.customer}</span>
        </div>
        <Tag color="cyan">{item.plan}</Tag>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Status:</span>
        <Tag
          color={
            item.status === 'active'
              ? 'green'
              : item.status === 'inactive'
              ? 'red'
              : 'orange'
          }
        >
          {item.status === 'active' ? 'Ativa' :
           item.status === 'inactive' ? 'Inativa' : 'Pendente'}
        </Tag>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Próxima Entrega:</span>
        <span>{item.nextDelivery}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Valor:</span>
        <span className="font-medium">R$ {item.value}</span>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          className="text-gray-600 hover:text-cyan-600"
        />
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          className="text-gray-600 hover:text-cyan-600"
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        <TableFilters
          onSearch={(value) => console.log('Search:', value)}
          onFilter={(filters) => console.log('Filter:', filters)}
          showStatus
          showDateRange
        />
        <MobileCardView
          data={dataSource}
          renderCard={renderMobileCard}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableFilters
        onSearch={(value) => console.log('Search:', value)}
        onFilter={(filters) => console.log('Filter:', filters)}
        showStatus
        showDateRange
      />
      <ResponsiveTable
        title="Assinaturas"
        dataSource={dataSource}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};