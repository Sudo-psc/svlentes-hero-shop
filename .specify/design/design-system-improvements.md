# SV Lentes Design System Improvements

**Created**: 2025-10-21
**Status**: Design Complete
**Version**: 2.0.0

---

## Executive Summary

This document outlines comprehensive improvements to the SV Lentes design system, enhancing consistency, accessibility, maintainability, and developer experience while maintaining LGPD compliance and Brazilian healthcare standards.

**Key Improvements**:
- Enhanced design token system with semantic naming
- Expanded component variant system
- Improved accessibility patterns
- Brazilian healthcare-specific design patterns
- Medical compliance visual indicators
- Performance-optimized component architecture

---

## Current State Analysis

### Strengths ✅
1. **Color System**: Well-defined cyan/silver palette with medical context
2. **Dark Mode**: Comprehensive dark mode support
3. **Component Library**: shadcn/ui components with Radix primitives
4. **Animations**: Custom animations (fade-in, slide-up, float, glow)
5. **Typography**: Inter (body) + Poppins (headings) hierarchy
6. **Brazilian Localization**: Proper currency, date, phone formatting

### Gaps Identified 🔍
1. **Design Tokens**: Missing semantic token layer (spacing, sizing, elevation)
2. **Component Variants**: Limited button/card variants for healthcare context
3. **Accessibility**: Missing skip links, reduced motion support
4. **Medical UI Patterns**: No standardized medical forms, prescription displays
5. **Error States**: Inconsistent error visualization patterns
6. **Loading States**: No unified skeleton/loading system
7. **Form Components**: Missing Brazilian-specific input patterns (CPF mask, phone mask)
8. **LGPD Indicators**: No visual consent indicators or data usage badges

---

## Design Token System 2.0

### Semantic Token Architecture

```typescript
// tokens/spacing.ts
export const spacing = {
  // Base scale (4px base unit)
  none: '0',
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px

  // Semantic spacing
  'component-gap': '0.5rem',
  'section-gap': '1rem',
  'page-padding': '1.5rem',
  'container-padding': '2rem',
}

// tokens/elevation.ts
export const elevation = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Medical context
  'medical-card': '0 2px 8px rgba(100, 116, 139, 0.08)',
  'medical-elevated': '0 8px 24px rgba(100, 116, 139, 0.12)',

  // Interactive states
  'hover': '0 8px 16px -4px rgba(0, 0, 0, 0.12)',
  'active': '0 2px 4px -1px rgba(0, 0, 0, 0.08)',
}

// tokens/sizing.ts
export const sizing = {
  // Touch targets (WCAG 2.1 AA: 44x44px minimum)
  'touch-min': '2.75rem',   // 44px
  'touch-comfortable': '3rem', // 48px

  // Component sizing
  'input-height': '2.75rem',
  'button-height': '2.75rem',
  'icon-sm': '1rem',
  'icon-md': '1.5rem',
  'icon-lg': '2rem',

  // Container widths
  'container-sm': '640px',
  'container-md': '768px',
  'container-lg': '1024px',
  'container-xl': '1280px',
  'container-2xl': '1536px',
}

// tokens/motion.ts
export const motion = {
  // Duration
  'duration-instant': '0ms',
  'duration-fast': '150ms',
  'duration-normal': '300ms',
  'duration-slow': '500ms',
  'duration-slower': '1000ms',

  // Easing
  'ease-linear': 'linear',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Reduced motion support
  'reduced-motion': 'prefers-reduced-motion: reduce',
}

// tokens/typography.ts
export const typography = {
  // Font families
  'font-sans': 'Inter, system-ui, sans-serif',
  'font-heading': 'Poppins, system-ui, sans-serif',
  'font-mono': 'Monaco, Courier New, monospace',

  // Font sizes (type scale)
  'text-xs': ['0.75rem', { lineHeight: '1rem' }],
  'text-sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'text-base': ['1rem', { lineHeight: '1.5rem' }],
  'text-lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'text-xl': ['1.25rem', { lineHeight: '1.75rem' }],
  'text-2xl': ['1.5rem', { lineHeight: '2rem' }],
  'text-3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  'text-4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  'text-5xl': ['3rem', { lineHeight: '1' }],
  'text-6xl': ['3.75rem', { lineHeight: '1' }],

  // Font weights
  'font-light': '300',
  'font-normal': '400',
  'font-medium': '500',
  'font-semibold': '600',
  'font-bold': '700',
  'font-extrabold': '800',

  // Line heights
  'leading-tight': '1.25',
  'leading-snug': '1.375',
  'leading-normal': '1.5',
  'leading-relaxed': '1.625',
  'leading-loose': '2',
}
```

### Brazilian Healthcare Color Palette

```typescript
// tokens/colors-healthcare.ts
export const healthcareColors = {
  // Medical credibility
  medical: {
    trust: '#0891b2',      // Professional cyan
    safety: '#16a34a',     // Medical green
    alert: '#f59e0b',      // Warning amber
    critical: '#dc2626',   // Emergency red
    neutral: '#64748b',    // Professional gray
  },

  // LGPD compliance indicators
  lgpd: {
    consent: '#22c55e',    // Consent given (green)
    pending: '#f59e0b',    // Consent pending (amber)
    revoked: '#ef4444',    // Consent revoked (red)
    info: '#3b82f6',       // Information (blue)
  },

  // Prescription status
  prescription: {
    valid: '#22c55e',      // Valid prescription
    expiring: '#f59e0b',   // Expiring soon
    expired: '#ef4444',    // Expired
    pending: '#94a3b8',    // Pending validation
  },

  // Brazilian payment methods
  payment: {
    pix: '#00c9a7',        // PIX green
    boleto: '#ff9500',     // Boleto orange
    card: '#3b82f6',       // Card blue
    approved: '#22c55e',   // Payment approved
    pending: '#f59e0b',    // Payment pending
    failed: '#ef4444',     // Payment failed
  },
}
```

---

## Component Architecture Improvements

### Enhanced Button Component

```typescript
// components/ui/button-enhanced.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
        outline: "border-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white active:bg-primary-700 shadow-sm hover:shadow-md",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // Healthcare-specific variants
        medical: "bg-medical-600 text-white hover:bg-medical-700 active:bg-medical-800 shadow-md",
        whatsapp: "bg-whatsapp-500 text-white hover:bg-whatsapp-600 active:bg-whatsapp-700 shadow-md flex items-center gap-2",
        pix: "bg-[#00c9a7] text-white hover:bg-[#00b894] active:bg-[#009d7f] shadow-md",
        emergency: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-lg animate-pulse-slow",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-11 w-11",
        'icon-sm': "h-8 w-8",
        'icon-lg': "h-14 w-14",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      loading: {
        true: "cursor-wait opacity-70",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading,
    loadingText,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    asChild = false,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        {loading && loadingText ? loadingText : children}
        {!loading && icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Enhanced Card Component

```typescript
// components/ui/card-enhanced.tsx
const cardVariants = cva(
  "rounded-lg border text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card shadow-sm hover:shadow-md",
        elevated: "bg-card shadow-lg hover:shadow-xl",
        medical: "bg-card border-medical-300 shadow-medical-card hover:shadow-medical-elevated",
        interactive: "bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        glass: "bg-card/80 backdrop-blur-sm shadow-glass border-white/10",
        gradient: "bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200",
        success: "bg-success-50 border-success-300",
        warning: "bg-warning-50 border-warning-300",
        error: "bg-red-50 border-red-300",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asLink?: boolean
  href?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, asLink, href, ...props }, ref) => {
    const Comp = asLink && href ? 'a' : 'div'

    return (
      <Comp
        ref={ref as any}
        href={href}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"
```

### Brazilian Input Components

```typescript
// components/ui/brazilian-inputs.tsx
import { IMaskInput } from 'react-imask'

// CPF Input with mask: XXX.XXX.XXX-XX
export const CPFInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <IMaskInput
        mask="000.000.000-00"
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        inputRef={ref}
        {...props}
      />
    )
  }
)

// Phone Input with mask: (XX) XXXXX-XXXX
export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <IMaskInput
        mask="(00) 00000-0000"
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        inputRef={ref}
        {...props}
      />
    )
  }
)

// Currency Input (Brazilian Real)
export const CurrencyInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <IMaskInput
          mask="num"
          blocks={{
            num: {
              mask: Number,
              thousandsSeparator: '.',
              radix: ',',
              mapToRadix: ['.'],
              scale: 2,
              normalizeZeros: true,
              padFractionalZeros: true,
            }
          }}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          inputRef={ref}
          {...props}
        />
      </div>
    )
  }
)

// Date Input (Brazilian format: DD/MM/YYYY)
export const DateInputBR = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <IMaskInput
        mask="00/00/0000"
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        inputRef={ref}
        placeholder="DD/MM/AAAA"
        {...props}
      />
    )
  }
)
```

### Medical-Specific Components

```typescript
// components/medical/prescription-card.tsx
export interface PrescriptionCardProps {
  status: 'valid' | 'expiring' | 'expired' | 'pending'
  doctorName: string
  doctorCRM: string
  issueDate: string
  expiryDate: string
  prescriptionDetails: {
    rightEye: string
    leftEye: string
    lensType: string
  }
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  status,
  doctorName,
  doctorCRM,
  issueDate,
  expiryDate,
  prescriptionDetails,
}) => {
  const statusConfig = {
    valid: { color: 'success', icon: CheckCircle, text: 'Válida' },
    expiring: { color: 'warning', icon: AlertCircle, text: 'Expirando em breve' },
    expired: { color: 'error', icon: XCircle, text: 'Expirada' },
    pending: { color: 'secondary', icon: Clock, text: 'Pendente validação' },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card variant="medical" className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg bg-${config.color}-100 border-l border-b border-${config.color}-300`}>
        <div className="flex items-center gap-1">
          <StatusIcon className={`h-4 w-4 text-${config.color}-600`} />
          <span className={`text-xs font-semibold text-${config.color}-700`}>
            {config.text}
          </span>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-lg font-semibold text-medical-700">
          Prescrição Médica
        </CardTitle>
        <CardDescription className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Médico:</span> {doctorName}
          </p>
          <p className="text-sm">
            <span className="font-medium">CRM:</span> {doctorCRM}
          </p>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Data de Emissão</p>
            <p className="text-sm font-medium">{issueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Validade</p>
            <p className="text-sm font-medium">{expiryDate}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-medical-700">
            Especificações
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-medical-50 rounded-md">
              <p className="text-xs text-muted-foreground">Olho Direito (OD)</p>
              <p className="font-mono font-medium">{prescriptionDetails.rightEye}</p>
            </div>
            <div className="p-3 bg-medical-50 rounded-md">
              <p className="text-xs text-muted-foreground">Olho Esquerdo (OE)</p>
              <p className="font-mono font-medium">{prescriptionDetails.leftEye}</p>
            </div>
          </div>
          <div className="p-3 bg-medical-50 rounded-md">
            <p className="text-xs text-muted-foreground">Tipo de Lente</p>
            <p className="font-medium">{prescriptionDetails.lensType}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// components/medical/doctor-badge.tsx
export const DoctorBadge: React.FC<{ name: string; crm: string }> = ({ name, crm }) => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-medical-50 border border-medical-200 rounded-full">
      <div className="flex items-center justify-center w-8 h-8 bg-medical-500 text-white rounded-full">
        <User className="h-4 w-4" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-medical-800">{name}</p>
        <p className="text-xs text-medical-600">{crm}</p>
      </div>
      <Shield className="h-4 w-4 text-medical-600" />
    </div>
  )
}
```

### LGPD Compliance Components

```typescript
// components/lgpd/consent-badge.tsx
export interface ConsentBadgeProps {
  status: 'granted' | 'pending' | 'revoked'
  purpose: string
  date?: string
}

export const ConsentBadge: React.FC<ConsentBadgeProps> = ({
  status,
  purpose,
  date
}) => {
  const statusConfig = {
    granted: {
      color: 'green',
      icon: CheckCircle,
      text: 'Consentimento Concedido',
      bg: 'bg-green-50',
      border: 'border-green-300',
      textColor: 'text-green-700'
    },
    pending: {
      color: 'amber',
      icon: Clock,
      text: 'Consentimento Pendente',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      textColor: 'text-amber-700'
    },
    revoked: {
      color: 'red',
      icon: XCircle,
      text: 'Consentimento Revogado',
      bg: 'bg-red-50',
      border: 'border-red-300',
      textColor: 'text-red-700'
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <StatusIcon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {purpose}
        </p>
        {date && (
          <p className="text-xs text-muted-foreground mt-1">
            Data: {date}
          </p>
        )}
      </div>
    </div>
  )
}

// components/lgpd/data-usage-indicator.tsx
export const DataUsageIndicator: React.FC<{
  dataTypes: string[]
  purpose: string
  retention: string
}> = ({ dataTypes, purpose, retention }) => {
  return (
    <Card variant="medical" className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Uso de Dados Pessoais</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Dados Coletados
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {dataTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Finalidade
          </p>
          <p className="text-sm mt-1">{purpose}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Retenção
          </p>
          <p className="text-sm mt-1">{retention}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Accessibility Enhancements

### Skip Links and Focus Management

```typescript
// components/a11y/skip-links.tsx
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Pular para conteúdo principal
      </a>
      <a
        href="#navigation"
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mt-16"
      >
        Pular para navegação
      </a>
    </div>
  )
}

// components/a11y/focus-trap.tsx
import { useFocusTrap } from '@/hooks/use-focus-trap'

export const FocusTrap: React.FC<{
  active: boolean
  children: React.ReactNode
}> = ({ active, children }) => {
  const ref = useFocusTrap(active)

  return (
    <div ref={ref}>
      {children}
    </div>
  )
}
```

### Reduced Motion Support

```css
/* globals.css - add to @layer base */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### ARIA Patterns

```typescript
// components/a11y/live-region.tsx
export const LiveRegion: React.FC<{
  type: 'polite' | 'assertive'
  message: string
  clearAfter?: number
}> = ({ type, message, clearAfter = 5000 }) => {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (clearAfter) {
      const timer = setTimeout(() => setVisible(false), clearAfter)
      return () => clearTimeout(timer)
    }
  }, [clearAfter])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
```

---

## Loading States & Skeletons

### Unified Skeleton System

```typescript
// components/ui/skeleton-system.tsx
export const Skeleton = {
  Text: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("h-4 bg-muted rounded animate-pulse", className)} {...props} />
  ),

  Avatar: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("w-12 h-12 bg-muted rounded-full animate-pulse", className)} {...props} />
  ),

  Card: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 space-y-4 bg-card border rounded-lg", className)} {...props}>
      <Skeleton.Text className="w-3/4" />
      <Skeleton.Text className="w-1/2" />
      <Skeleton.Text className="w-full" />
    </div>
  ),

  Button: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("h-11 w-32 bg-muted rounded-md animate-pulse", className)} {...props} />
  ),

  Input: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("h-11 w-full bg-muted rounded-md animate-pulse", className)} {...props} />
  ),
}

// Usage example
export const PrescriptionCardSkeleton = () => (
  <Card variant="medical">
    <CardHeader>
      <Skeleton.Text className="w-1/2 h-6" />
      <Skeleton.Text className="w-3/4" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton.Text />
        <Skeleton.Text />
      </div>
      <Separator />
      <div className="space-y-2">
        <Skeleton.Text className="w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      </div>
    </CardContent>
  </Card>
)
```

---

## Responsive Design Tokens

### Breakpoint System

```typescript
// tokens/breakpoints.ts
export const breakpoints = {
  xs: '475px',    // Extra small devices (large phones)
  sm: '640px',    // Small devices (tablets)
  md: '768px',    // Medium devices (small laptops)
  lg: '1024px',   // Large devices (desktops)
  xl: '1280px',   // Extra large devices (large desktops)
  '2xl': '1536px', // 2X large devices (very large desktops)
}

// Responsive container queries
export const containerQueries = {
  'container-xs': '@container (min-width: 20rem)',
  'container-sm': '@container (min-width: 24rem)',
  'container-md': '@container (min-width: 28rem)',
  'container-lg': '@container (min-width: 32rem)',
  'container-xl': '@container (min-width: 36rem)',
}
```

---

## Implementation Plan

### Phase 1: Token System (Week 1)
1. Create `src/tokens/` directory structure
2. Implement semantic token files (spacing, elevation, sizing, motion, typography)
3. Update `tailwind.config.js` to use new tokens
4. Create healthcare-specific color tokens
5. Test token consistency across light/dark modes

### Phase 2: Component Enhancements (Week 2-3)
1. Enhance Button component with new variants and loading states
2. Enhance Card component with healthcare variants
3. Create Brazilian input components (CPF, Phone, Currency, Date)
4. Build medical-specific components (PrescriptionCard, DoctorBadge)
5. Build LGPD compliance components (ConsentBadge, DataUsageIndicator)

### Phase 3: Accessibility (Week 4)
1. Implement skip links and focus management
2. Add reduced motion support
3. Create ARIA pattern components
4. Audit existing components for WCAG 2.1 AA compliance
5. Add keyboard navigation improvements

### Phase 4: Loading States (Week 5)
1. Create unified skeleton system
2. Build skeleton variants for all major components
3. Implement progressive loading patterns
4. Add suspense boundaries

### Phase 5: Documentation & Testing (Week 6)
1. Create Storybook stories for all new components
2. Write component usage documentation
3. Create design system style guide
4. Accessibility testing with screen readers
5. Cross-browser testing

---

## Success Criteria

### Functional Requirements
- ✅ All components support light/dark modes
- ✅ Brazilian input masks work correctly
- ✅ Medical components display prescription data accurately
- ✅ LGPD components reflect consent states correctly
- ✅ Loading states provide clear feedback

### Non-Functional Requirements
- ✅ WCAG 2.1 AA compliance (Lighthouse score ≥ 90)
- ✅ Performance: No CLS, LCP < 2.5s
- ✅ Mobile responsiveness: 375px - 1920px
- ✅ TypeScript: Full type coverage, no `any` types
- ✅ Bundle size: No increase > 10% from current

### Compliance Requirements
- ✅ LGPD visual indicators functional
- ✅ Medical credibility preserved (CRM display)
- ✅ Brazilian localization maintained
- ✅ Emergency contacts always visible

---

## Dependencies

### New Packages Required
```json
{
  "react-imask": "^7.1.3",          // Brazilian input masks
  "@radix-ui/react-focus-scope": "^1.0.4",  // Focus management
  "class-variance-authority": "^0.7.0",     // Already installed
  "tailwindcss-animate": "^1.0.7"           // Already installed
}
```

### No Breaking Changes
- All existing components remain functional
- New components are additive
- Token system extends existing Tailwind config
- Gradual migration path available

---

## Migration Guide

### Step 1: Import New Tokens
```typescript
// Old
<div className="p-6 shadow-md">

// New
<div className="p-[var(--spacing-lg)] shadow-[var(--elevation-md)]">
```

### Step 2: Use Enhanced Components
```typescript
// Old Button
<Button variant="default">Click me</Button>

// New Button with loading
<Button variant="default" loading={isLoading} loadingText="Processando...">
  Click me
</Button>

// Medical variant
<Button variant="medical">Agendar Consulta</Button>
```

### Step 3: Brazilian Inputs
```typescript
// Old
<Input type="text" placeholder="CPF" />

// New
<CPFInput placeholder="Digite seu CPF" />
<PhoneInput placeholder="(00) 00000-0000" />
<CurrencyInput placeholder="R$ 0,00" />
<DateInputBR placeholder="DD/MM/AAAA" />
```

---

## Maintenance Guidelines

### Token Updates
- Always update tokens in `src/tokens/` first
- Run visual regression tests after token changes
- Update Storybook documentation
- Test in light and dark modes

### Component Creation
- Follow shadcn/ui patterns
- Use `React.forwardRef` for ref support
- Include TypeScript interfaces
- Add className prop for extensibility
- Document all props in JSDoc

### Accessibility Checklist
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader tested
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] Reduced motion respected

---

## Related Documents

- **Constitution**: `.specify/memory/constitution.md`
- **CLAUDE.md**: Project-specific guidance
- **Tailwind Config**: `tailwind.config.js`
- **Global Styles**: `src/app/globals.css`
- **Component Library**: `src/components/ui/`

---

## Revision History

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| 2.0.0   | 2025-10-21 | Initial design system improvements |
