// Tipos para formulários e interações
export interface LeadFormData {
    nome: string;
    whatsapp: string;
    email: string;
    lgpdConsent: boolean;
}
export interface CalculatorData extends LeadFormData {
    currentSpending: number;
    lensType: 'daily' | 'weekly' | 'monthly';
    usage: 'occasional' | 'regular' | 'daily';
}
export interface SubscriptionFormData {
    leadInfo: LeadFormData; // Dados já capturados
    personalInfo: {
        fullName: string;
        cpf: string;
        birthDate: string;
        address: {
            cep: string;
            street: string;
            number: string;
            complement?: string;
            city: string;
            state: string;
        };
    };
    prescription: {
        hasValidPrescription: boolean;
        prescriptionFile?: File;
        rightEye: {
            sphere: number;
            cylinder: number;
            axis: number;
        };
        leftEye: {
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescriptionDate: string;
        doctorName: string;
        needsConsultation: boolean;
    };
    preferences: {
        lensType: 'daily' | 'weekly' | 'monthly';
        deliveryFrequency: 'monthly' | 'quarterly' | 'semiannual';
        specialNeeds?: string;
        addOns: string[]; // IDs dos add-ons selecionados
    };
    selectedPlan: string;
}
export interface WhatsAppMessage {
    type: 'lead' | 'consultation' | 'support';
    userData: Partial<LeadFormData>;
    context: {
        page: string;
        planInterest?: string;
        calculatedEconomy?: number;
    };
    prefilledMessage: string;
}