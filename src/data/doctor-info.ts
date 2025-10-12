// Dados do Dr. Philipe Saraiva Cruz - Médico responsável pela SV Lentes

export const doctorInfo = {
    name: 'Dr. Philipe Saraiva Cruz',
    crm: 'CRM 69.870',
    crmEquipe: 'CRM_EQP 155869.006',
    specialty: 'Oftalmologia',
    photo: '/icones/drphilipe_perfil.jpeg',
    credentials: [
        'Especialista em Oftalmologia',
        'Graduado em Medicina pela Universidade Federal',
        'Residência em Oftalmologia',
        'Especialização em Lentes de Contato',
        'Membro da Sociedade Brasileira de Oftalmologia'
    ],
    experience: '10+ anos de experiência em oftalmologia',
    bio: 'Dr. Philipe Saraiva Cruz é pioneiro no Brasil em serviços de assinatura de lentes de contato com acompanhamento médico especializado. Com mais de 10 anos de experiência, dedica-se a proporcionar cuidado oftalmológico personalizado e acessível.',
    contact: {
        whatsapp: '+5533998601427',
        email: 'dr.philipe@svlentes.com.br',
        clinicAddress: 'Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG'
    },
    socialProof: {
        patientsServed: '5000+',
        yearsExperience: '10+',
        satisfactionRate: '98%',
        consultationsPerformed: '10000+'
    }
}

export const trustIndicators = {
    anvisa: {
        name: 'ANVISA',
        description: 'Produtos aprovados pela Agência Nacional de Vigilância Sanitária',
        logo: '/images/selo-anvisa.png',
        verified: true
    },
    crm: {
        name: 'Conselho Regional de Medicina',
        description: 'Médico registrado no CRM-SP',
        number: 'CRM 69.870',
        logo: '/images/selo-crm.png',
        verified: true
    },
    sbo: {
        name: 'Sociedade Brasileira de Oftalmologia',
        description: 'Membro ativo da SBO',
        logo: '/images/selo-sbo.png',
        verified: true
    },
    ssl: {
        name: 'Certificado SSL',
        description: 'Conexão segura e criptografada',
        logo: '/images/ssl-badge.png',
        verified: true
    },
    lgpd: {
        name: 'Conformidade LGPD',
        description: 'Em conformidade com a Lei Geral de Proteção de Dados',
        logo: '/images/lgpd-badge.png',
        verified: true
    }
}

export const clinicInfo = {
    name: 'SV Lentes',
    fullName: 'SV Lentes - Serviços Oftalmológicos Especializados',
    cnpj: '12.345.678/0001-90',
    address: {
        street: 'Rua Catarina Maria Passos, 97',
        neighborhood: 'Santa Zita',
        city: 'Caratinga',
        state: 'MG',
        zipCode: '35300-299',
        country: 'Brasil'
    },
    contact: {
        phone: '+55 33 99860-1427',
        whatsapp: '+55 33 99860-1427',
        email: 'contato@svlentes.com.br',
        website: 'https://svlentes.com.br'
    },
    businessHours: {
        weekdays: 'Segunda a Sexta: 8h às 18h',
        saturday: 'Sábado: 8h às 12h',
        sunday: 'Domingo: Fechado',
        emergency: '24h via WhatsApp para emergências'
    },
    coverage: {
        area: 'Atendimento em todo o Brasil',
        shipping: 'Entrega gratuita em todo território nacional',
        consultation: 'Consultas presenciais e telemedicina'
    }
}
