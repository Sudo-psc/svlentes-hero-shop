import { NextResponse } from 'next/server'
import { doctorInfo, clinicInfo } from '@/data/doctor-info'

/**
 * LLM-optimized endpoint for structured service information
 * Provides comprehensive data about SVLentes for AI assistants and search engines
 *
 * NOTE: Pricing is managed via Stripe Pricing Table integration.
 * Values below reflect the actual plans sold through Stripe.
 */
export async function GET() {
  // Correct pricing from Stripe - DO NOT use hardcoded pricingPlans data
  const stripePlans = [
    {
      id: "basico-mensal",
      nome: "Plano Básico Online - Mensal",
      descricao: "Plano essencial para uso regular de lentes de contato com acompanhamento médico básico",
      tipoLente: "Asféricas",
      cicloPagamento: "monthly",
      precoMensal: "R$ 129,99",
      precoTotal: "R$ 129,99",
      beneficios: ["1 par de lentes asféricas mensais", "Consulta de acompanhamento", "Entrega em todo Brasil", "Suporte via WhatsApp"],
      ativo: true
    },
    {
      id: "basico-anual",
      nome: "Plano Básico Online - Anual",
      descricao: "Plano essencial com economia no pagamento anual e acompanhamento médico básico",
      tipoLente: "Asféricas",
      cicloPagamento: "yearly",
      precoMensal: "R$ 99,92",
      precoTotal: "R$ 1.199,00",
      economia: {
        percentual: "23%",
        valorEconomizado: "R$ 360,88",
        precoAnterior: "R$ 1.559,88"
      },
      beneficios: ["12 pares de lentes asféricas", "Consultas de acompanhamento", "Entrega em todo Brasil", "Economia de 23%", "Suporte via WhatsApp"],
      ativo: true
    },
    {
      id: "padrao-mensal",
      nome: "Plano Padrão Online - Mensal",
      descricao: "Plano intermediário com benefícios adicionais e acompanhamento médico completo",
      tipoLente: "Asféricas Premium",
      cicloPagamento: "monthly",
      precoMensal: "R$ 179,99",
      precoTotal: "R$ 179,99",
      beneficios: ["1 par de lentes premium mensais", "Consultas ilimitadas online", "Entrega prioritária", "Suporte prioritário", "Acessórios inclusos"],
      ativo: true
    },
    {
      id: "padrao-anual",
      nome: "Plano Padrão Online - Anual",
      descricao: "Plano intermediário com economia no pagamento anual e benefícios completos",
      tipoLente: "Asféricas Premium",
      cicloPagamento: "yearly",
      precoMensal: "R$ 139,08",
      precoTotal: "R$ 1.668,90",
      economia: {
        percentual: "23%",
        valorEconomizado: "R$ 491,00",
        precoAnterior: "R$ 2.159,88"
      },
      beneficios: ["12 pares de lentes premium", "Consultas ilimitadas online", "Entrega prioritária", "Suporte prioritário", "Acessórios inclusos", "Economia de 23%"],
      ativo: true
    },
    {
      id: "premium-mensal",
      nome: "Plano Premium Online - Mensal",
      descricao: "Plano completo com todos os benefícios e acompanhamento médico VIP presencial + online",
      tipoLente: "Asféricas Premium Plus",
      cicloPagamento: "monthly",
      precoMensal: "R$ 229,99",
      precoTotal: "R$ 229,99",
      beneficios: ["1 par de lentes premium plus mensais", "Consultas ilimitadas (presenciais + online)", "Entrega express 24h", "Suporte VIP 24/7", "Kit completo de acessórios", "Descontos em serviços oftalmológicos"],
      ativo: true
    },
    {
      id: "premium-anual",
      nome: "Plano Premium Online - Anual",
      descricao: "Plano completo com máxima economia e todos os benefícios VIP",
      tipoLente: "Asféricas Premium Plus",
      cicloPagamento: "yearly",
      precoMensal: "R$ 189,00",
      precoTotal: "R$ 2.268,00",
      economia: {
        percentual: "18%",
        valorEconomizado: "R$ 491,88",
        precoAnterior: "R$ 2.759,88"
      },
      beneficios: ["12 pares de lentes premium plus", "Consultas ilimitadas (presenciais + online)", "Entrega express 24h", "Suporte VIP 24/7", "Kit completo de acessórios", "Descontos em serviços oftalmológicos", "Economia de 18%"],
      ativo: true
    }
  ]

  const serviceInfo = {
    nome: "SVLentes",
    slogan: "Nunca mais fique sem lentes",
    descricao: "Serviço pioneiro de assinatura de lentes de contato com acompanhamento médico oftalmológico",
    diferencial: "Único serviço de assinatura de lentes com acompanhamento médico especializado incluído",

    responsavelMedico: {
      nome: doctorInfo.name,
      crm: doctorInfo.crm,
      crmCompleto: `${doctorInfo.crm} (${doctorInfo.crmState})`,
      especialidade: doctorInfo.specialty || "Oftalmologista",
      bio: doctorInfo.bio
    },

    clinica: {
      nome: clinicInfo.name,
      nomeCompleto: clinicInfo.fullName,
      endereco: {
        rua: clinicInfo.address.street,
        cidade: clinicInfo.address.city,
        estado: clinicInfo.address.state,
        cep: clinicInfo.address.zipCode,
        pais: clinicInfo.address.country
      },
      contato: {
        telefone: clinicInfo.contact.phone,
        whatsapp: clinicInfo.contact.whatsapp,
        email: clinicInfo.contact.email
      }
    },

    planos: stripePlans,

    observacaoImportante: "Os planos são vendidos exclusivamente através da tabela de preços Stripe integrada na página /planos. Os valores acima refletem os preços reais cobrados através do Stripe.",

    comoFunciona: [
      "1. Escolha seu plano (Express ou VIP)",
      "2. Informe seu grau com receita médica válida",
      "3. Configure forma de pagamento (PIX, boleto ou cartão)",
      "4. Receba em casa com entrega automática mensal"
    ],

    vantagens: [
      "Nunca mais fique sem lentes",
      "Acompanhamento médico oftalmológico incluído",
      "Entrega automática mensal em todo o Brasil",
      "Lentes sempre novas e dentro da validade",
      "Comodidade de receber em casa",
      "Economia no plano anual (até 29%)",
      "Suporte via WhatsApp",
      "Consultas presenciais em Caratinga/MG",
      "Telemedicina disponível em todo Brasil"
    ],

    tiposLentes: [
      {
        tipo: "Lentes Asféricas",
        descricao: "Lentes com design avançado para maior conforto e visão nítida",
        disponivel: true
      },
      {
        tipo: "Lentes Diárias",
        descricao: "Lentes de descarte diário para máximo conforto e praticidade",
        disponivel: true,
        observacao: "Consultar disponibilidade via WhatsApp"
      },
      {
        tipo: "Lentes Tóricas",
        descricao: "Lentes especializadas para correção de astigmatismo",
        disponivel: true,
        observacao: "Consultar disponibilidade via WhatsApp"
      },
      {
        tipo: "Lentes Coloridas",
        descricao: "Lentes com cores para transformar o visual",
        disponivel: true,
        observacao: "Consultar disponibilidade via WhatsApp"
      }
    ],

    cobertura: {
      entrega: "Todo o Brasil via Correios",
      consultasPresenciais: ["Caratinga/MG", "Ipatinga/MG", "Belo Horizonte/MG"],
      telemedicina: "Todo o território nacional"
    },

    contato: {
      whatsapp: clinicInfo.contact.whatsapp,
      whatsappFormatado: "(33) 99989-8026",
      telefone: clinicInfo.contact.phone,
      email: clinicInfo.contact.email,
      website: "https://svlentes.com.br",
      websiteAlternativo: "https://svlentes.shop"
    },

    pagamento: {
      processador: "Asaas (brasileiro) e Stripe (internacional)",
      metodos: ["PIX", "Boleto Bancário", "Cartão de Crédito"],
      parcelamento: "Até 12x no cartão de crédito",
      seguranca: "Pagamento seguro e criptografado"
    },

    tecnologia: {
      plataforma: "Next.js 14",
      autenticacao: "Firebase e Clerk",
      banco: "PostgreSQL + Prisma",
      integracao: "Asaas (pagamentos), SendPulse (WhatsApp), Stripe (backup)"
    },

    regulamentacao: {
      anvisa: "Todas as lentes certificadas pela ANVISA",
      lgpd: "Conforme Lei Geral de Proteção de Dados (LGPD)",
      cfm: "Conforme regulamentações do Conselho Federal de Medicina",
      prescricaoMedica: "Obrigatória para todos os tipos de lentes"
    },

    identidadeVisual: {
      coresPrincipais: ["Ciano (#06b6d4)", "Prata (#64748b)", "Branco"],
      logo: "Olho estilizado com texto SVLentes",
      estilo: "Moderno, clean, profissional, confiável"
    },

    faq: [
      {
        pergunta: "Como funciona a entrega?",
        resposta: "As lentes são entregues mensalmente no seu endereço cadastrado, sem custo adicional de frete. Você recebe automaticamente antes de acabar suas lentes atuais."
      },
      {
        pergunta: "As consultas estão incluídas?",
        resposta: "Sim! Todos os planos incluem consultas de acompanhamento com oftalmologista, tanto presenciais quanto por telemedicina."
      },
      {
        pergunta: "Posso cancelar a assinatura?",
        resposta: "Sim, você pode pausar ou cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento."
      },
      {
        pergunta: "Preciso de receita médica?",
        resposta: "Sim, para sua segurança e saúde ocular, é necessário ter uma receita médica válida. Se você ainda não tem, podemos agendar uma consulta."
      },
      {
        pergunta: "Qual a diferença entre os planos?",
        resposta: "O Plano Express é essencial para uso regular. O Plano VIP oferece consultas ilimitadas, entrega prioritária em 24h, acessórios exclusivos e economia de 29%."
      }
    ],

    metadados: {
      ultimaAtualizacao: new Date().toISOString(),
      versao: "1.0.0",
      fonte: "SVLentes API - Dados oficiais extraídos do sistema"
    }
  }

  return NextResponse.json(serviceInfo, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
