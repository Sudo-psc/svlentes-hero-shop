/**
 * Sistema de Gerenciamento de Ícones - SV Lentes (Auto-Updated)
 *
 * Este módulo centraliza todos os ícones do projeto, fornecendo:
 * - Tipagem TypeScript forte
 * - Categorização lógica
 * - Metadados para otimização
 * - Sugestões de uso contextual
 * - Auto-detecção de novos ícones
 * - Substituição automática de emojis
 */

import React, { useState } from 'react'
import Image from 'next/image'

export type IconCategory =
  | 'atendimento'
  | 'beneficios'
  | 'processos'
  | 'medico'
  | 'badges'
  | 'perfil'
  | 'stats'
  | 'calculator';

export interface IconMetadata {
  /** Nome do arquivo do ícone */
  filename: string;
  /** Caminho relativo a partir de /public */
  path: string;
  /** Categoria funcional */
  category: IconCategory;
  /** Descrição do uso recomendado */
  description: string;
  /** Tamanho recomendado em pixels */
  recommendedSize: {
    width: number;
    height: number;
  };
  /** Contextos sugeridos de uso */
  suggestedUse: string[];
  /** Alt text padrão para acessibilidade */
  defaultAlt: string;
  /** Emoji que este ícone substitui (se aplicável) */
  emoji?: string;
  /** Se o ícone está atualmente em uso */
  isActive?: boolean;
}

export interface IconProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Catálogo completo de ícones disponíveis (Auto-Updated)
 */
export const ICONS: Record<string, IconMetadata> = {
  // ===== ESTATÍSTICAS E CALCULADORA (ALTA PRIORIDADE - EM USO) =====
  calc: {
    filename: 'calc.png',
    path: '/icones/calc.png',
    category: 'calculator',
    description: 'Calculadora de economia - ícone principal da seção',
    recommendedSize: { width: 80, height: 80 },
    suggestedUse: ['seção calculadora', 'economia', 'CTA principal'],
    defaultAlt: 'Calculadora de economia SVlentes',
    emoji: '🧮',
    isActive: true
  },

  atendido: {
    filename: 'atendido.png',
    path: '/icones/atendido.png',
    category: 'stats',
    description: 'Clientes satisfeitos - estatística de atendimento',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['estatísticas', 'social proof', 'seção economia'],
    defaultAlt: '5.000+ clientes satisfeitos',
    emoji: '👥',
    isActive: true
  },

  fortyPercent: {
    filename: '40percent.png',
    path: '/icones/40percent.png',
    category: 'stats',
    description: 'Economia de 40% - estatística de economia',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['estatísticas', 'economia', 'benefícios'],
    defaultAlt: '40% de economia média',
    emoji: '📊',
    isActive: true
  },

  twelveH: {
    filename: '12h.png',
    path: '/icones/12h.png',
    category: 'stats',
    description: 'Tempo economizado - 12 horas por ano',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['estatísticas', 'benefícios de tempo', 'conveniência'],
    defaultAlt: '12 horas economizadas por ano',
    emoji: '⏰',
    isActive: true
  },

  piggyBankStats: {
    filename: 'piggy_bank_with_dollar_coin.png',
    path: '/icones/piggy_bank_with_dollar_coin.png',
    category: 'stats',
    description: 'Economia média anual - R$ 800',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['estatísticas', 'economia anual', 'benefícios financeiros'],
    defaultAlt: 'R$ 800 de economia média anual',
    emoji: '💰',
    isActive: true
  },

  // ===== ATENDIMENTO E SUPORTE =====
  customerService: {
    filename: 'customer_service_icon.png',
    path: '/icones/customer_service_icon.png',
    category: 'atendimento',
    description: 'Ícone de atendimento ao cliente via WhatsApp/Chat',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['seção de contato', 'botão de suporte', 'FAQ', 'header'],
    defaultAlt: 'Atendimento ao cliente SV Lentes',
    emoji: '📞'
  },

  atendimento24x7: {
    filename: 'icon_atend24:7.png',
    path: '/icones/icon_atend24:7.png',
    category: 'atendimento',
    description: 'Ícone destacando disponibilidade 24/7',
    recommendedSize: { width: 80, height: 80 },
    suggestedUse: ['seção de benefícios', 'cards de vantagens', 'hero section'],
    defaultAlt: 'Atendimento 24 horas por dia, 7 dias por semana',
    emoji: '🕐'
  },

  amorSaude: {
    filename: 'icon_amoresaude.png',
    path: '/icones/icon_amoresaude.png',
    category: 'atendimento',
    description: 'Ícone representando cuidado e amor à saúde',
    recommendedSize: { width: 48, height: 48 },
    suggestedUse: ['seção sobre nós', 'valores da empresa', 'footer'],
    defaultAlt: 'Cuidado e amor com sua saúde ocular',
    emoji: '❤️'
  },

  // ===== BENEFÍCIOS E VANTAGENS =====
  shieldSecurity: {
    filename: 'blue_shield_checkmark_icon.png',
    path: '/icones/blue_shield_checkmark_icon.png',
    category: 'beneficios',
    description: 'Escudo de segurança com checkmark - garantia e confiança',
    recommendedSize: { width: 72, height: 72 },
    suggestedUse: ['seção de garantias', 'benefícios', 'compliance LGPD'],
    defaultAlt: 'Segurança e garantia nos serviços',
    emoji: '🛡️'
  },

  premiumQuality: {
    filename: 'diamond_and_star_icon.png',
    path: '/icones/diamond_and_star_icon.png',
    category: 'beneficios',
    description: 'Diamante com estrela - qualidade premium',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['planos premium', 'diferenciais', 'qualidade do produto'],
    defaultAlt: 'Qualidade premium garantida',
    emoji: '💎'
  },

  piggyBank: {
    filename: 'piggy_bank_with_dollar_coin.png',
    path: '/icones/piggy_bank_with_dollar_coin.png',
    category: 'beneficios',
    description: 'Cofrinho com moeda - economia e valor',
    recommendedSize: { width: 80, height: 80 },
    suggestedUse: ['calculadora de economia', 'comparação de preços', 'benefícios financeiros'],
    defaultAlt: 'Economia com assinatura de lentes',
    emoji: '💰'
  },

  calculator: {
    filename: 'colorful_calculator_icon.png',
    path: '/icones/colorful_calculator_icon.png',
    category: 'beneficios',
    description: 'Calculadora colorida - cálculo de economia',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['seção calculadora', 'simulador de preços', 'CTA de economia'],
    defaultAlt: 'Calcule sua economia',
    emoji: '🧮'
  },

  // ===== PROCESSOS E ENTREGA =====
  delivery: {
    filename: 'hand_holding_package_icon.png',
    path: '/icones/hand_holding_package_icon.png',
    category: 'processos',
    description: 'Mão segurando pacote - entrega de lentes',
    recommendedSize: { width: 72, height: 72 },
    suggestedUse: ['seção como funciona', 'processo de entrega', 'benefícios logísticos'],
    defaultAlt: 'Entrega de lentes em domicílio',
    emoji: '📦'
  },

  location: {
    filename: 'cartoon-character-location-icon.png',
    path: '/icones/cartoon-character-location-icon.png',
    category: 'processos',
    description: 'Personagem com pin de localização',
    recommendedSize: { width: 80, height: 80 },
    suggestedUse: ['área de cobertura', 'localização da clínica', 'mapa de atendimento'],
    defaultAlt: 'Localização e área de atendimento',
    emoji: '📍'
  },

  // ===== MÉDICO E CONSULTAS =====
  eyeCalendar: {
    filename: 'eye-calendar-icon.png',
    path: '/icones/eye-calendar-icon.png',
    category: 'medico',
    description: 'Olho com calendário - agendamento de consultas',
    recommendedSize: { width: 72, height: 72 },
    suggestedUse: ['agendamento', 'consultas', 'acompanhamento médico'],
    defaultAlt: 'Agende sua consulta oftalmológica',
    emoji: '👁️'
  },

  eyeCheckAward: {
    filename: 'eye_check_award_icon.png',
    path: '/icones/eye_check_award_icon.png',
    category: 'medico',
    description: 'Exame oftalmológico com selo de qualidade',
    recommendedSize: { width: 80, height: 80 },
    suggestedUse: ['seção médica', 'exames', 'diferenciais clínicos'],
    defaultAlt: 'Exames oftalmológicos certificados',
    emoji: '🏆'
  },

  // ===== BADGES E SELOS =====
  popularBadge: {
    filename: 'flaming_crown_popular_badge.png',
    path: '/icones/flaming_crown_popular_badge.png',
    category: 'badges',
    description: 'Coroa flamejante - plano mais popular',
    recommendedSize: { width: 56, height: 56 },
    suggestedUse: ['cards de planos', 'destaque de produtos', 'pricing'],
    defaultAlt: 'Plano mais popular',
    emoji: '👑'
  },

  anniversaryBadge: {
    filename: 'ten_year_anniversary_badge.png',
    path: '/icones/ten_year_anniversary_badge.png',
    category: 'badges',
    description: 'Selo comemorativo - tradição e qualidade',
    recommendedSize: { width: 64, height: 64 },
    suggestedUse: ['sobre nós', 'credibilidade', 'footer', 'testimonials'],
    defaultAlt: 'Qualidade e tradição',
    emoji: '🎉'
  },

  // ===== PERFIL =====
  drPhilipe: {
    filename: 'drphilipe_perfil.jpeg',
    path: '/icones/drphilipe_perfil.jpeg',
    category: 'perfil',
    description: 'Foto de perfil do Dr. Philipe Saraiva Cruz',
    recommendedSize: { width: 120, height: 120 },
    suggestedUse: ['sobre nós', 'equipe médica', 'testimonials', 'footer'],
    defaultAlt: 'Dr. Philipe Saraiva Cruz - CRM-MG 69.870',
    emoji: '👨‍⚕️'
  },

  userPin: {
    filename: 'Pin_icon_menino.png',
    path: '/icones/Pin_icon_menino.png',
    category: 'perfil',
    description: 'Avatar de usuário - representação de cliente',
    recommendedSize: { width: 48, height: 48 },
    suggestedUse: ['área do usuário', 'perfil', 'testimonials'],
    defaultAlt: 'Usuário SV Lentes',
    emoji: '👤'
  }
} as const;

/**
 * Tipo auxiliar para garantir uso correto das chaves de ícones
 */
export type IconKey = keyof typeof ICONS;

/**
 * Helper para obter ícones por categoria
 */
export function getIconsByCategory(category: IconCategory): IconMetadata[] {
  return Object.values(ICONS).filter(icon => icon.category === category);
}

/**
 * Helper para obter caminho completo do ícone
 */
export function getIconPath(iconKey: keyof typeof ICONS): string {
  return ICONS[iconKey].path;
}

/**
 * Helper para obter alt text padrão
 */
export function getIconAlt(iconKey: keyof typeof ICONS): string {
  return ICONS[iconKey].defaultAlt;
}

/**
 * Helper para encontrar ícone por emoji
 */
export function findIconByEmoji(emoji: string): IconKey | null {
  const iconKey = Object.keys(ICONS).find(
    key => ICONS[key as IconKey].emoji === emoji
  );
  return iconKey as IconKey || null;
}

/**
 * Helper para obter ícones ativos (em uso)
 */
export function getActiveIcons(): IconMetadata[] {
  return Object.values(ICONS).filter(icon => icon.isActive);
}

/**
 * Generic Icon component with error handling and fallback
 */
export function Icon({
  name,
  size = 24,
  className = '',
  alt,
  fallbackEmoji
}: IconProps & {
  name: IconKey;
  fallbackEmoji?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const iconData = ICONS[name];

  if (!iconData) {
    console.warn(`Icon "${name}" not found in registry`);
    return fallbackEmoji ? <span className={className}>{fallbackEmoji}</span> : null;
  }

  // If image failed to load, show emoji fallback
  if (hasError && (fallbackEmoji || iconData.emoji)) {
    return (
      <span
        className={className}
        style={{ fontSize: size }}
        title={alt || iconData.defaultAlt}
      >
        {fallbackEmoji || iconData.emoji}
      </span>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <Image
        src={iconData.path}
        alt={alt || iconData.defaultAlt}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 24px, 32px"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

/**
 * Convenience helper functions to get icon paths
 * Use these with Image component directly or with the Icon component above
 */
export function getCalcIcon() {
  return { ...ICONS.calc };
}

export function getAtendidoIcon() {
  return { ...ICONS.atendido };
}

export function getFortyPercentIcon() {
  return { ...ICONS.fortyPercent };
}

export function getTwelveHIcon() {
  return { ...ICONS.twelveH };
}

export function getPiggyBankIcon() {
  return { ...ICONS.piggyBankStats };
}/*
*
 * Individual icon components with fallback support
 */
export function CalcIcon({ size = 24, className = '', alt }: IconProps) {
  return (
    <Icon
      name="calc"
      size={size}
      className={className}
      alt={alt || "Calculadora de economia SVlentes"}
      fallbackEmoji="🧮"
    />
  );
}

export function AtendidoIcon({ size = 24, className = '', alt }: IconProps) {
  return (
    <Icon
      name="atendido"
      size={size}
      className={className}
      alt={alt || "5.000+ clientes satisfeitos"}
      fallbackEmoji="👥"
    />
  );
}

export function FortyPercentIcon({ size = 24, className = '', alt }: IconProps) {
  return (
    <Icon
      name="fortyPercent"
      size={size}
      className={className}
      alt={alt || "40% de economia média"}
      fallbackEmoji="📊"
    />
  );
}

export function TwelveHIcon({ size = 24, className = '', alt }: IconProps) {
  return (
    <Icon
      name="twelveH"
      size={size}
      className={className}
      alt={alt || "12 horas economizadas por ano"}
      fallbackEmoji="⏰"
    />
  );
}

export function PiggyBankIcon({ size = 24, className = '', alt }: IconProps) {
  return (
    <Icon
      name="piggyBankStats"
      size={size}
      className={className}
      alt={alt || "R$ 800 de economia média anual"}
      fallbackEmoji="💰"
    />
  );
}