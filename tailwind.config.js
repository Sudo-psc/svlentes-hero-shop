/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    50: '#f0f9ff',   /* Very light teal-blue */
                    100: '#e0f2fe',  /* Light teal-blue */
                    200: '#bae6fd',  /* Soft teal-blue */
                    300: '#7dd3fc',  /* Medium light teal-blue */
                    400: '#38bdf8',  /* Medium teal-blue */
                    500: '#0ea5e9',  /* Standard teal-blue */
                    600: '#004D61',  /* Azul petróleo (primary) */
                    700: '#003d4d',  /* Darker petróleo */
                    800: '#002d39',  /* Very dark petróleo */
                    900: '#001d25',  /* Deepest petróleo */
                },
                luxury: {
                    50: '#fafbfc',   /* Off-white */
                    100: '#f9fafb',  /* Off-white light */
                    200: '#e8ecef',  /* Cinza-claro */
                    300: '#d1d5db',  /* Light gray */
                    400: '#9ca3af',  /* Medium gray */
                    500: '#6b7280',  /* Standard gray */
                    600: '#4b5563',  /* Deep gray */
                    700: '#374151',  /* Darker gray */
                    800: '#1f2937',  /* Very dark gray */
                    900: '#111827',  /* Deepest gray */
                },
                pearl: {
                    50: '#f8fafc',   /* Pearl white */
                    100: '#f1f5f9',  /* Light pearl */
                    200: '#e2e8f0',  /* Soft pearl */
                    300: '#cbd5e1',  /* Medium pearl */
                    400: '#94a3b8',  /* Medium pearl-gray */
                    500: '#64748b',  /* Standard pearl-gray */
                    600: '#475569',  /* Deep pearl-gray */
                    700: '#334155',  /* Darker pearl-gray */
                    800: '#1e293b',  /* Very dark pearl-gray */
                    900: '#0f172a',  /* Deepest pearl-gray */
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                    50: '#f8fafc',   /* Very light silver */
                    100: '#f1f5f9',  /* Light silver */
                    200: '#e2e8f0',  /* Soft silver */
                    300: '#cbd5e1',  /* Medium light silver */
                    400: '#94a3b8',  /* Medium silver */
                    500: '#64748b',  /* Standard silver */
                    600: '#475569',  /* Deep silver */
                    700: '#334155',  /* Darker silver */
                    800: '#1e293b',  /* Very dark silver */
                    900: '#0f172a',  /* Deepest silver */
                },
                silver: {
                    50: '#fafafa',   /* Very light silver metallic */
                    100: '#f5f5f5',  /* Light silver metallic */
                    200: '#e5e5e5',  /* Soft silver metallic */
                    300: '#d4d4d4',  /* Medium light silver metallic */
                    400: '#a3a3a3',  /* Medium silver metallic */
                    500: '#737373',  /* Standard silver metallic */
                    600: '#525252',  /* Deep silver metallic */
                    700: '#404040',  /* Darker silver metallic */
                    800: '#262626',  /* Very dark silver metallic */
                    900: '#171717',  /* Deepest silver metallic */
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                    50: '#f0fdf4',   /* Very light green */
                    100: '#dcfce7',  /* Light green */
                    200: '#bbf7d0',  /* Soft green */
                    300: '#86efac',  /* Medium light green */
                    400: '#4ade80',  /* Medium green */
                    500: '#22c55e',  /* Standard green */
                    600: '#16a34a',  /* Deep green (success) */
                    700: '#15803d',  /* Darker green */
                    800: '#166534',  /* Very dark green */
                    900: '#14532d',  /* Deepest green */
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                    50: '#fffbeb',   /* Very light amber */
                    100: '#fef3c7',  /* Light amber */
                    200: '#fde68a',  /* Soft amber */
                    300: '#fcd34d',  /* Medium light amber */
                    400: '#fbbf24',  /* Medium amber */
                    500: '#f59e0b',  /* Standard amber (warning) */
                    600: '#d97706',  /* Deep amber */
                    700: '#b45309',  /* Darker amber */
                    800: '#92400e',  /* Very dark amber */
                    900: '#78350f',  /* Deepest amber */
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                medical: {
                    50: '#f8fafc',   /* Very light medical gray */
                    100: '#f1f5f9',  /* Light medical gray */
                    200: '#e2e8f0',  /* Soft medical gray */
                    300: '#cbd5e1',  /* Medium light medical gray */
                    400: '#94a3b8',  /* Medium medical gray */
                    500: '#64748b',  /* Standard medical gray */
                    600: '#475569',  /* Deep medical gray */
                    700: '#334155',  /* Darker medical gray */
                    800: '#1e293b',  /* Very dark medical gray */
                    900: '#0f172a',  /* Deepest medical gray */
                },
                whatsapp: {
                    DEFAULT: '#25d366',  /* WhatsApp green */
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#25d366',  /* Official WhatsApp green */
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                admin: {
                    // Admin-specific colors for dashboard
                    sidebar: 'hsl(var(--admin-sidebar))',
                    sidebarForeground: 'hsl(var(--admin-sidebar-foreground))',
                    sidebarHover: 'hsl(var(--admin-sidebar-hover))',
                    sidebarActive: 'hsl(var(--admin-sidebar-active))',
                    dashboard: 'hsl(var(--admin-dashboard))',
                    dashboardCard: 'hsl(var(--admin-dashboard-card))',
                    metrics: {
                        revenue: 'hsl(var(--admin-metrics-revenue))',
                        customers: 'hsl(var(--admin-metrics-customers))',
                        orders: 'hsl(var(--admin-metrics-orders))',
                        support: 'hsl(var(--admin-metrics-support))',
                        growth: 'hsl(var(--admin-metrics-growth))',
                        warning: 'hsl(var(--admin-metrics-warning))',
                    },
                    status: {
                        online: '#10b981',
                        offline: '#6b7280',
                        busy: '#f59e0b',
                        away: '#3b82f6',
                    }
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
                heading: ['Poppins', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
            },
            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0',
                wide: '0.025em',
                wider: '0.05em',
                widest: '0.1em',
                luxury: '0.03em',
            },
            lineHeight: {
                'luxury': '1.8',
                'heading': '1.2',
                'tight': '1.25',
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                'fade-in': 'fadeIn 0.6s ease-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'slide-in': 'slideIn 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'logo-glow': 'logoGlow 6s ease-in-out infinite',
                'scale-in': 'scaleIn 0.3s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                DEFAULT: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 77, 97, 0.08)',
                'glass-lg': '0 16px 64px 0 rgba(0, 77, 97, 0.12)',
                'liquid': '0 4px 24px 0 rgba(0, 77, 97, 0.10), 0 2px 8px 0 rgba(0, 77, 97, 0.06)',
                'liquid-lg': '0 8px 40px 0 rgba(0, 77, 97, 0.14), 0 4px 16px 0 rgba(0, 77, 97, 0.08)',
                'premium': '0 2px 16px 0 rgba(0, 77, 97, 0.06), 0 1px 4px 0 rgba(0, 77, 97, 0.04)',
                'premium-lg': '0 4px 24px 0 rgba(0, 77, 97, 0.10), 0 2px 8px 0 rgba(0, 77, 97, 0.06)',
                'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                'soft-lg': '0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 4px 0 rgba(0, 0, 0, 0.03)',
                'neon': '0 0 20px rgba(0, 77, 97, 0.3)',
                'neon-lg': '0 0 40px rgba(0, 77, 97, 0.4)',
            },
            backgroundImage: {
                'gradient-luxury': 'linear-gradient(135deg, #004D61 0%, #0ea5e9 100%)',
                'gradient-pearl': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                'gradient-teal': 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #e2e8f0 100%)',
                'gradient-radial-luxury': 'radial-gradient(circle at top right, #004D61 0%, #0ea5e9 50%, #f8fafc 100%)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(0, 77, 97, 0.3)' },
                    '100%': { boxShadow: '0 0 30px rgba(0, 77, 97, 0.5)' },
                },
                logoGlow: {
                    '0%, 100%': {
                        transform: 'scale(1)',
                        filter: 'drop-shadow(0 0 0 rgba(0, 77, 97, 0.0))',
                    },
                    '50%': {
                        transform: 'scale(1.03)',
                        filter: 'drop-shadow(0 0 16px rgba(0, 77, 97, 0.35))',
                    },
                },
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
