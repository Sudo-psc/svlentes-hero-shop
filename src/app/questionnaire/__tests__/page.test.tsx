import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestionnairePage from '@/app/questionnaire/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { PrivacyProvider } from '@/components/privacy/PrivacyProvider';

// Mock the useConfigValue hook
jest.mock('@/lib/use-config', () => ({
  useConfigValue: jest.fn().mockReturnValue(null),
}));

// Mock the useClientConfig hook
jest.mock('@/lib/use-client-config', () => ({
  useClientConfig: jest.fn().mockReturnValue({ config: null, loading: false, error: null }),
}));

// Mock the useTranslation hook
jest.mock('@/lib/translation', () => ({
  useTranslation: jest.fn().mockReturnValue({ t: (key: string) => key }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <PrivacyProvider>{ui}</PrivacyProvider>
    </AuthProvider>
  );
};

describe('QuestionnairePage', () => {
  it('renders the main heading', () => {
    renderWithProviders(<QuestionnairePage />);
    expect(screen.getByText('Recomendação Personalizada de Correção Visual')).toBeInTheDocument();
  });

  it('renders the Header and Footer components', () => {
    renderWithProviders(<QuestionnairePage />);
    // Check for an element unique to the Header
    expect(screen.getByLabelText('SV Lentes - Voltar para a página inicial')).toBeInTheDocument();
    // Check for an element unique to the Footer
    expect(screen.getByText(/© \d{4} SV Lentes. Todos os direitos reservados./)).toBeInTheDocument();
  });

  it('renders the QuestionCard, Progress, and Navigation components', () => {
    renderWithProviders(<QuestionnairePage />);
    // Check for QuestionCard content
    expect(screen.getByText(/What is your primary motivation/)).toBeInTheDocument();
    // Check for QuestionProgress content
    expect(screen.getByText('Progress')).toBeInTheDocument();
    // Check for QuestionNavigation content
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
