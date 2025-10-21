# Ant Design Mobile-First Dashboard Implementation Guide

This guide explains how to use the mobile-first Ant Design dashboard components implemented in your project.

## 🚀 Quick Start

### 1. Basic Dashboard Setup

```tsx
'use client';

import { AntdProvider } from '@/components/antd-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DashboardMetrics } from '@/components/dashboard-metrics';

export default function MyDashboard() {
  return (
    <AntdProvider>
      <DashboardLayout
        title="My Dashboard"
        subtitle="Mobile-first responsive design"
        showMetrics={true}
        showNavigation={true}
      >
        {/* Your dashboard content here */}
      </DashboardLayout>
    </AntdProvider>
  );
}
```

### 2. Responsive Grid Usage

```tsx
import { ResponsiveGrid, ResponsiveCol } from '@/components/dashboard/responsive-grid';

function MyComponent() {
  return (
    <ResponsiveGrid gutter={[16, 16]}>
      <ResponsiveCol xs={24} sm={12} md={8} lg={6}>
        {/* Content - Full width on mobile, half on tablet, 1/3 on desktop */}
      </ResponsiveCol>

      <ResponsiveCol xs={24} md={12}>
        {/* Content - Full width on mobile, half on larger screens */}
      </ResponsiveCol>
    </ResponsiveGrid>
  );
}
```

## 📱 Mobile-First Breakpoints

The implementation uses these breakpoints:

- **Mobile**: `< 768px` (xs, sm)
- **Tablet**: `768px - 1023px` (md)
- **Desktop**: `≥ 1024px` (lg, xl, xxl)

### Grid Column Behavior

| Screen Size | Default Column Span | Example Usage |
|------------|---------------------|-------------|
| Mobile (xs) | 24 (full width) | Cards stack vertically |
| Small (sm) | 24 (full width) | Good for touch targets |
| Medium (md) | 12 (half width) | Tablet landscape |
| Large (lg) | 8 (1/3 width) | Desktop |
| XL (xl) | 6 (1/4 width) | Large desktop |
| XXL (xxl) | 6 (1/4 width) | Extra large |

## 🎨 Components Overview

### 1. Dashboard Layout

```tsx
<DashboardLayout
  title="Dashboard Title"
  subtitle="Optional subtitle"
  showMetrics={true}        // Show metrics cards
  showNavigation={true}     // Show sidebar/top nav
>
  {/* Your content */}
</DashboardLayout>
```

### 2. Dashboard Metrics

```tsx
import { DashboardMetrics } from '@/components/dashboard-metrics';

// Automatic responsive metrics
<DashboardMetrics
  isMobile={false}  // Auto-detected if not provided
/>

// Or use individual metric cards
import { MetricCard } from '@/components/dashboard-metrics';

<MetricCard
  title="Revenue"
  value="$2,450"
  prefix={<DollarOutlined />}
  icon={<DollarOutlined />}
  color="#22c55e"
  trend={{ value: 12.5, isPositive: true }}
/>
```

### 3. Responsive Charts

```tsx
import {
  ResponsiveLineChart,
  ResponsiveBarChart,
  ResponsivePieChart,
  ResponsiveDoughnutChart,
  ResponsiveRadarChart
} from '@/components/dashboard/responsive-charts';

<ResponsiveLineChart
  title="Monthly Revenue"
  data={chartData}
  height={300}  // Automatically adjusted for mobile
/>

<ResponsiveBarChart
  title="Customer Growth"
  data={chartData}
  height={250}
/>
```

### 4. Data Tables

```tsx
import { SubscriptionTable } from '@/components/dashboard/dashboard-data-table';

<SubscriptionTable
  dataSource={subscriptionData}
  loading={false}
  // Automatically shows mobile card view on small screens
/>
```

## 🎯 Best Practices

### 1. Touch-Friendly Design

```tsx
// Use larger buttons on mobile
const buttonSize = isMobile ? 'large' : 'middle';

// Ensure adequate spacing
const spacing = isMobile ? [8, 8] : [16, 16];
```

### 2. Progressive Enhancement

```tsx
// Start with mobile layout, enhance for larger screens
<ResponsiveCol xs={24} sm={12} md={8}>
  {/* Content works on all screens */}
</ResponsiveCol>
```

### 3. Performance Optimization

```tsx
// Use React.memo for expensive components
const ExpensiveChart = React.memo(({ data }) => {
  return <ResponsiveLineChart data={data} />;
});

// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

## 🔧 Customization

### 1. Theme Configuration

Edit `src/lib/antd-config.ts`:

```tsx
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#06b6d4',  // Your brand color
    controlHeight: 44,         // Mobile touch targets
    fontSize: 14,              // Mobile font size
  },
  components: {
    Button: {
      controlHeight: 44,      // Larger on mobile
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
      paddingLG: 16,
    },
  },
};
```

### 2. Custom Breakpoints

```tsx
// In your component
const { isMobile, isTablet, isDesktop } = useResponsiveGrid();

if (isMobile) {
  return <MobileView />;
} else if (isTablet) {
  return <TableView />;
} else {
  return <DesktopView />;
}
```

## 📊 Chart Data Format

### Line/Bar Chart Data

```tsx
const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Revenue',
    data: [2100, 2300, 2150, 2450, 2600, 2450],
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  }],
};
```

### Pie/Doughnut Chart Data

```tsx
const pieData = {
  labels: ['Monthly', 'Quarterly', 'Annual'],
  datasets: [{
    data: [45, 30, 25],
    backgroundColor: ['#06b6d4', '#22c55e', '#f59e0b'],
  }],
};
```

## 🧪 Testing Responsive Design

### 1. Browser DevTools

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different device sizes:
   - iPhone SE (375x667)
   - iPad (768x1024)
   - Desktop (1920x1080)

### 2. Viewport Testing

```bash
# Test different screen sizes
npm run dev
# Then test manually at:
# - 320px width (small mobile)
# - 768px width (tablet)
# - 1024px width (desktop)
# - 1920px width (large desktop)
```

## 🚀 Production Checklist

- [ ] Test on real mobile devices
- [ ] Verify touch targets are ≥44px
- [ ] Check text readability on small screens
- [ ] Test horizontal scrolling (should be minimal)
- [ ] Verify all interactive elements work with touch
- [ ] Test performance on mobile devices
- [ ] Check accessibility with screen readers

## 📱 Mobile Navigation Patterns

### 1. Hamburger Menu (Default)

```tsx
<MobileNavigation />  // Automatically appears on mobile
```

### 2. Bottom Tab Navigation (Alternative)

```tsx
import { MobileBottomNavigation } from '@/components/dashboard/mobile-navigation';

<MobileBottomNavigation activeKey="dashboard" />
```

### 3. Swipe Gestures (Advanced)

```tsx
// Add swipe gestures for mobile
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => navigateNext(),
  onSwipedRight: () => navigatePrevious(),
});
```

## 🔍 Debugging

### 1. Responsive Debug Panel

```tsx
// Add to your dashboard for debugging
const ResponsiveDebug = () => {
  const { isMobile, isTablet, isDesktop } = useResponsiveGrid();

  return (
    <div className="fixed top-0 right-0 bg-red-500 text-white p-2 text-xs z-50">
      {isMobile && 'Mobile'}
      {isTablet && 'Tablet'}
      {isDesktop && 'Desktop'}
    </div>
  );
};
```

### 2. Console Logging

```tsx
// Add to components for debugging
useEffect(() => {
  console.log('Screen size:', {
    width: window.innerWidth,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });
}, []);
```

## 📚 Additional Resources

- [Ant Design Responsive Grid](https://ant.design/components/grid/)
- [Mobile-First Design Principles](https://www.uxbooth.com/articles/mobile-first-design/)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/quickref/#target-size)
- [Chart.js Responsive Options](https://www.chartjs.org/docs/configuration/responsive/)

## 🆘 Troubleshooting

### Issue: Charts don't resize properly

```tsx
// Ensure proper height setting
<ResponsiveLineChart
  data={data}
  height={isMobile ? 250 : 300}  // Different heights for different screens
/>
```

### Issue: Tables overflow on mobile

```tsx
// Tables automatically switch to card view on mobile
<SubscriptionTable
  dataSource={data}
  // Card view appears automatically on screens < 768px
/>
```

### Issue: Buttons too small on mobile

```tsx
// Use the mobile-aware button size
<Button size={isMobile ? 'large' : 'middle'}>
  Click me
</Button>
```

---

## 🎉 You're Ready!

Your mobile-first Ant Design dashboard is now ready to use. The components automatically adapt to different screen sizes, providing an optimal experience on mobile, tablet, and desktop devices.