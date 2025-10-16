export async function sendWhatsAppMessage(data: {
  phone: string;
  message?: string;
  context?: 'hero' | 'pricing' | 'consultation' | 'support' | 'calculator' | 'emergency';
  userData?: {
    nome?: string;
    email?: string;
    whatsapp?: string;
  };
  contextData?: {
    page?: string;
    section?: string;
    planInterest?: string;
    calculatedEconomy?: number;
  };
}) {
  try {
    const response = await fetch('/api/sendpulse/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message via SendPulse:', error);
    throw error;
  }
}

export async function getContactInfo(phone: string) {
  try {
    const response = await fetch(
      `/api/sendpulse/messages?phone=${encodeURIComponent(phone)}`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(result.error || 'Failed to get contact info');
    }

    return result.contact;
  } catch (error) {
    console.error('Error getting contact info from SendPulse:', error);
    throw error;
  }
}
