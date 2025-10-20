/**
 * Componente Icon - SV Lentes
 *
 * Componente reutilizável para renderização de ícones com:
 * - Lazy loading automático
 * - Otimização de imagens (Next.js Image)
 * - Acessibilidade (alt text, ARIA)
 * - Responsividade
 * - Tipagem TypeScript
 */
import Image from 'next/image';
import { ICONS, type IconKey, getIconPath, getIconAlt } from '@/lib/icons';
import { cn } from '@/lib/utils';
export interface IconProps {
  /** Chave do ícone no catálogo */
  name: IconKey;
  /** Tamanho do ícone (usa o recomendado por padrão) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  /** Tamanho customizado em pixels (quando size='custom') */
  customSize?: {
    width: number;
    height: number;
  };
  /** Alt text customizado (sobrescreve o padrão) */
  alt?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Prioridade de carregamento (para imagens above-the-fold) */
  priority?: boolean;
  /** Callback ao clicar no ícone */
  onClick?: () => void;
  /** Se o ícone é decorativo (esconde de screen readers) */
  decorative?: boolean;
}
/**
 * Mapeamento de tamanhos pré-definidos
 */
const SIZE_MAP = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 }
} as const;
/**
 * Componente Icon
 *
 * @example
 * ```tsx
 * // Uso básico
 * <Icon name="customerService" />
 *
 * // Tamanho customizado
 * <Icon name="drPhilipe" size="xl" />
 *
 * // Totalmente customizado
 * <Icon
 *   name="calculator"
 *   customSize={{ width: 100, height: 100 }}
 *   alt="Calculadora de economia personalizada"
 *   priority
 * />
 * ```
 */
export function Icon({
  name,
  size = 'md',
  customSize,
  alt,
  className,
  priority = false,
  onClick,
  decorative = false
}: IconProps) {
  const iconMetadata = ICONS[name];
  // Determina o tamanho final do ícone
  const dimensions =
    size === 'custom' && customSize
      ? customSize
      : size === 'md'
        ? iconMetadata.recommendedSize
        : SIZE_MAP[size as keyof typeof SIZE_MAP] || SIZE_MAP.md;
  // Alt text final (customizado ou padrão)
  const altText = alt || getIconAlt(name);
  // Classes base do componente
  const baseClasses = cn(
    'relative inline-block',
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );
  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Image
        src={getIconPath(name)}
        alt={decorative ? '' : altText}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        aria-hidden={decorative}
        quality={90}
      />
    </div>
  );
}
/**
 * Componente IconGroup
 *
 * Renderiza múltiplos ícones em grupo com espaçamento consistente
 *
 * @example
 * ```tsx
 * <IconGroup
 *   icons={['customerService', 'atendimento24x7', 'amorSaude']}
 *   size="lg"
 *   spacing="md"
 * />
 * ```
 */
export interface IconGroupProps {
  /** Lista de ícones a renderizar */
  icons: IconKey[];
  /** Tamanho uniforme dos ícones */
  size?: IconProps['size'];
  /** Espaçamento entre ícones */
  spacing?: 'sm' | 'md' | 'lg';
  /** Layout (horizontal ou vertical) */
  layout?: 'horizontal' | 'vertical';
  /** Classes CSS adicionais */
  className?: string;
}
const SPACING_MAP = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
} as const;
export function IconGroup({
  icons,
  size = 'md',
  spacing = 'md',
  layout = 'horizontal',
  className
}: IconGroupProps) {
  const containerClasses = cn(
    'flex items-center',
    layout === 'horizontal' ? 'flex-row' : 'flex-col',
    SPACING_MAP[spacing],
    className
  );
  return (
    <div className={containerClasses}>
      {icons.map((iconName) => (
        <Icon key={iconName} name={iconName} size={size} />
      ))}
    </div>
  );
}
/**
 * Componente IconBadge
 *
 * Renderiza um ícone como badge com posicionamento absoluto
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <PlanCard />
 *   <IconBadge name="popularBadge" position="top-right" />
 * </div>
 * ```
 */
export interface IconBadgeProps {
  /** Nome do ícone badge */
  name: IconKey;
  /** Posição do badge */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Offset em pixels do canto */
  offset?: number;
  /** Classes CSS adicionais */
  className?: string;
}
const POSITION_MAP = {
  'top-left': 'top-0 left-0',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-right': 'bottom-0 right-0'
} as const;
export function IconBadge({
  name,
  position = 'top-right',
  offset = 8,
  className
}: IconBadgeProps) {
  const badgeClasses = cn(
    'absolute z-10',
    POSITION_MAP[position],
    className
  );
  const style = {
    transform: `translate(${position.includes('right') ? offset : -offset}px, ${position.includes('bottom') ? offset : -offset
      }px)`
  };
  return (
    <div className={badgeClasses} style={style}>
      <Icon name={name} size="sm" />
    </div>
  );
}