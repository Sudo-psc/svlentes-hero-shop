// Tipos baseados no wireframe da landing page

export interface HeaderProps {
    logo: string; // "SV Lentes"
    navigation: {
        planos: string;
        comoFunciona: string;
        faq: string;
        contato: string;
    };
    ctaPrimary: string; // "Agendar Consulta"
    utilityIcons: string[]; // idioma/conta
}

export interface HeroSectionProps {
    badge: string; // "Pioneiro no Brasil"
    headline: string; // "Nunca mais fique sem lentes"
    subheadline: string; // Assinatura integrada com logística e consulta
    ctaPrimary: string; // "Agendar Consulta"
    ctaSecondary: string; // "Falar no WhatsApp"
    trustIndicators: {
        anvisa: string;
        crm: string; // "CRM 69.870"
        outros: string[];
    };
    doctorCard: {
        photo: string;
        name: string; // Dr. Philipe Saraiva Cruz
        crm: string; // CRM real
        credentials: string;
    };
    leadForm: {
        fields: ['nome', 'whatsapp', 'email'];
        lgpdConsent: boolean;
        ctaCalculator: string; // "Calcule sua economia"
    };
}

export interface ProblemSolutionProps {
    problems: Array<{
        icon: string;
        text: string;
    }>;
    solutions: Array<{
        icon: string;
        title: string;
        description: string;
    }>;
    ctaContextual: string; // "Fale com um especialista"
}

export interface HowItWorksProps {
    tabs: ['Mensal', 'Anual'];
    steps: Array<{
        number: number;
        title: string;
        description: string;
        cost?: string;
        economy?: string;
    }>;
    timeline: {
        visual: string;
        steps: string[];
    };
}

export interface PricingPlan {
    id: string;
    name: string;
    badge?: string; // Badge do plano (ex: "Pioneiro no Brasil", "Premium")
    popularBadge?: string; // Badge de destaque (ex: "Mais Popular")
    description?: string; // Descrição detalhada do plano
    priceMonthly: number;
    priceAnnual: number;
    priceTotal?: number; // Alias para priceTotal (para compatibilidade)
    pricePerLens?: number; // Custo por lente individual
    features: string[];
    recommended?: boolean;
    stripeProductId: string;
    stripePriceId: string;
    asaasProductId?: string; // ID do produto no Asaas (gateway brasileiro)
    ctaText: string; // "Assinar" ou "Agendar"

    // Extended properties for enhanced functionality
    lensType?: string; // Tipo de lente (ex: 'asferica', 'torica', 'diaria')
    billingCycle?: string; // Ciclo de cobrança (ex: 'monthly', 'quarterly', 'annual')
    consultationType?: string; // Tipo de consulta
    serviceLevel?: string; // Nível de serviço
    installments?: number; // Número de parcelas
    economy?: any; // Informações de economia
    highlight?: boolean; // Destaque visual
    benefits?: string[]; // Benefícios adicionais
    deliveryInfo?: any; // Informações de entrega
    consultationInfo?: any; // Informações de consulta
    supportInfo?: any; // Informações de suporte
    tags?: string[]; // Tags para categorização
    targetAudience?: string[]; // Público-alvo
    isActive?: boolean; // Status de ativação
    sortOrder?: number; // Ordenação
}

export interface PricingSectionProps {
    tabs: ['Mensal', 'Anual'];
    plans: PricingPlan[];
    comparisonTable: {
        features: string[];
        planComparison: Record<string, boolean | string>[];
    };
}

export interface ReferralProgramProps {
    mainCard: {
        title: string;
        description: string;
        benefitIndicator: string;
        benefitIndicated: string;
    };
    rulesCard: {
        title: string;
        rules: string[];
    };
}

export interface AddOn {
    id: string;
    name: string;
    description: string;
    price?: number;
    type: 'consulta' | 'teleorientacao' | 'seguro' | 'vip';
}

export interface AddOnsProps {
    services: AddOn[];
    layout: 'chips' | 'cards';
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

export interface FAQProps {
    items: FAQItem[];
    layout: 'accordion';
    numbering: boolean; // true para numeração
}

export interface FinalCTAProps {
    valueReinforcement: string;
    benefits: string[];
    ctaPrimary: string; // "Agendar Consulta"
    ctaWhatsApp: string; // "Falar no WhatsApp"
    quickForm?: {
        fields: string[];
        placement: 'mobile' | 'desktop';
    };
}

export interface FooterProps {
    legalInfo: {
        address: string;
        doctorCRM: string; // "CRM 106.888" / "CRM_EQP 155869.006"
        businessHours: string;
    };
    utilityLinks: {
        policies: string[];
        terms: string[];
    };
    contact: {
        whatsappFloat: boolean; // ícone flutuante mobile
        businessCoverage: string; // "atendimento Brasil"
    };
}