'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
import { Card, Space, Typography } from 'antd';
import { useMediaQuery } from '@/hooks/use-media-query';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const { Text } = Typography;

// Chart configuration for responsive design
const getChartOptions = (isMobile: boolean, isTablet: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: isMobile ? 'bottom' : 'top' as const,
      labels: {
        boxWidth: isMobile ? 12 : 15,
        padding: isMobile ? 10 : 15,
        font: {
          size: isMobile ? 11 : 12,
        },
      },
    },
    title: {
      display: true,
      font: {
        size: isMobile ? 14 : 16,
      },
      padding: {
        bottom: isMobile ? 10 : 20,
      },
    },
    tooltip: {
      titleFont: {
        size: isMobile ? 12 : 14,
      },
      bodyFont: {
        size: isMobile ? 11 : 12,
      },
      padding: isMobile ? 8 : 12,
    },
  },
  scales: {
    x: {
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
        maxRotation: isMobile ? 45 : 0,
      },
      grid: {
        display: !isMobile,
      },
    },
    y: {
      ticks: {
        font: {
          size: isMobile ? 10 : 12,
        },
      },
      grid: {
        display: !isMobile,
      },
    },
  },
});

// Responsive Line Chart Component
interface ResponsiveLineChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension?: number;
    }>;
  };
  height?: number;
  className?: string;
}

export const ResponsiveLineChart: React.FC<ResponsiveLineChartProps> = ({
  title,
  data,
  height = 300,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const options = React.useMemo(() => ({
    ...getChartOptions(isMobile, isTablet),
    plugins: {
      ...getChartOptions(isMobile, isTablet).plugins,
      title: {
        ...getChartOptions(isMobile, isTablet).plugins.title,
        text: title,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }), [isMobile, isTablet, title]);

  return (
    <div className={className} style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

// Responsive Bar Chart Component
interface ResponsiveBarChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string | string[];
      borderColor?: string;
    }>;
  };
  height?: number;
  className?: string;
}

export const ResponsiveBarChart: React.FC<ResponsiveBarChartProps> = ({
  title,
  data,
  height = 300,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const options = React.useMemo(() => ({
    ...getChartOptions(isMobile, isTablet),
    plugins: {
      ...getChartOptions(isMobile, isTablet).plugins,
      title: {
        ...getChartOptions(isMobile, isTablet).plugins.title,
        text: title,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
          maxRotation: isMobile ? 45 : 0,
        },
        grid: {
          display: !isMobile,
        },
      },
      y: {
        stacked: true,
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
        grid: {
          display: !isMobile,
        },
      },
    },
  }), [isMobile, isTablet, title]);

  return (
    <div className={className} style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Responsive Pie Chart Component
interface ResponsivePieChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }>;
  };
  height?: number;
  className?: string;
}

export const ResponsivePieChart: React.FC<ResponsivePieChartProps> = ({
  title,
  data,
  height = 300,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const options = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right' as const,
        labels: {
          boxWidth: isMobile ? 12 : 15,
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 11 : 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: isMobile ? 14 : 16,
        },
        padding: {
          bottom: isMobile ? 10 : 20,
        },
      },
      tooltip: {
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 12,
        },
        padding: isMobile ? 8 : 12,
      },
    },
  }), [isMobile, isTablet, title]);

  return (
    <div className={className} style={{ height }}>
      <Pie data={data} options={options} />
    </div>
  );
};

// Responsive Doughnut Chart Component
interface ResponsiveDoughnutChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }>;
  };
  height?: number;
  className?: string;
}

export const ResponsiveDoughnutChart: React.FC<ResponsiveDoughnutChartProps> = ({
  title,
  data,
  height = 300,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const options = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right' as const,
        labels: {
          boxWidth: isMobile ? 12 : 15,
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 11 : 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: isMobile ? 14 : 16,
        },
        padding: {
          bottom: isMobile ? 10 : 20,
        },
      },
      tooltip: {
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 12,
        },
        padding: isMobile ? 8 : 12,
      },
    },
  }), [isMobile, isTablet, title]);

  return (
    <div className={className} style={{ height }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Responsive Radar Chart Component
interface ResponsiveRadarChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      pointBackgroundColor: string;
      pointBorderColor: string;
    }>;
  };
  height?: number;
  className?: string;
}

export const ResponsiveRadarChart: React.FC<ResponsiveRadarChartProps> = ({
  title,
  data,
  height = 300,
  className = '',
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const options = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'top' as const,
        labels: {
          boxWidth: isMobile ? 12 : 15,
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 11 : 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: isMobile ? 14 : 16,
        },
        padding: {
          bottom: isMobile ? 10 : 20,
        },
      },
      tooltip: {
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 12,
        },
        padding: isMobile ? 8 : 12,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: !isMobile,
        },
        grid: {
          color: isMobile ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)',
        },
        pointLabels: {
          font: {
            size: isMobile ? 10 : 12,
          },
        },
        ticks: {
          backdropColor: 'transparent',
          font: {
            size: isMobile ? 9 : 10,
          },
        },
      },
    },
  }), [isMobile, isTablet, title]);

  return (
    <div className={className} style={{ height }}>
      <Radar data={data} options={options} />
    </div>
  );
};

// Chart Container Wrapper with Card
export const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}> = ({ title, children, className = '', loading = false }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <Card
      className={`shadow-sm border-0 hover:shadow-md transition-shadow ${className}`}
      bodyStyle={{
        padding: isMobile ? '12px' : '16px',
      }}
      loading={loading}
    >
      <Space direction="vertical" size="middle" className="w-full">
        <Text className="text-gray-800 font-medium text-sm">{title}</Text>
        {children}
      </Space>
    </Card>
  );
};

// Sample data generator for testing
export const generateSampleData = () => ({
  monthlyRevenue: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [{
      label: 'Receita Mensal',
      data: [2100, 2300, 2150, 2450, 2600, 2450],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      tension: 0.4,
    }],
  },
  subscriptionTypes: {
    labels: ['Mensal', 'Trimestral', 'Semestral', 'Anual'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6'],
      borderWidth: 0,
    }],
  },
  customerMetrics: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Novos Clientes',
        data: [12, 19, 15, 25, 22, 30],
        backgroundColor: '#06b6d4',
      },
      {
        label: 'Clientes Ativos',
        data: [89, 95, 92, 103, 108, 115],
        backgroundColor: '#22c55e',
      },
    ],
  },
});