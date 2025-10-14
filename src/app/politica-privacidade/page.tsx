import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';

export const metadata: Metadata = {
    title: 'Política de Privacidade | SV Lentes - Assinatura de Lentes',
    description: 'Política de privacidade da SV Lentes em conformidade com a LGPD. Saiba como protegemos seus dados pessoais.',
    robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            Política de Privacidade
                        </h1>

                        <div className="prose max-w-none">
                            <p className="text-sm text-gray-600 mb-8">
                                Última atualização: {new Date().toLocaleDateString('pt-BR')}
                            </p>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">1. Informações Gerais</h2>
                                <p className="mb-4">
                                    A SV Lentes, sob responsabilidade médica do Dr. Philipe Saraiva Cruz
                                    (CRM 69.870), está comprometida com a proteção da privacidade e dos dados pessoais
                                    de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">2. Dados Coletados</h2>
                                <p className="mb-4">Coletamos os seguintes tipos de dados:</p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li><strong>Dados de Identificação:</strong> Nome completo, CPF, data de nascimento</li>
                                    <li><strong>Dados de Contato:</strong> E-mail, telefone/WhatsApp, endereço completo</li>
                                    <li><strong>Dados Médicos:</strong> Prescrição oftalmológica, histórico de uso de lentes</li>
                                    <li><strong>Dados de Navegação:</strong> Cookies, endereço IP, dados de uso do site</li>
                                    <li><strong>Dados de Pagamento:</strong> Informações processadas pelo Stripe (não armazenamos dados de cartão)</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">3. Finalidades do Tratamento</h2>
                                <p className="mb-4">Utilizamos seus dados para:</p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li>Prestação do serviço de assinatura de lentes de contato</li>
                                    <li>Acompanhamento médico oftalmológico</li>
                                    <li>Processamento de pagamentos e gestão de assinaturas</li>
                                    <li>Comunicação sobre seu tratamento e serviços</li>
                                    <li>Melhoria dos nossos serviços (com seu consentimento)</li>
                                    <li>Cumprimento de obrigações legais e regulatórias</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">4. Base Legal</h2>
                                <p className="mb-4">O tratamento dos seus dados é baseado em:</p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li><strong>Execução de contrato:</strong> Para prestação dos serviços contratados</li>
                                    <li><strong>Consentimento:</strong> Para comunicações de marketing e análises</li>
                                    <li><strong>Legítimo interesse:</strong> Para melhoria dos serviços e segurança</li>
                                    <li><strong>Cumprimento legal:</strong> Para atender obrigações médicas e fiscais</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
                                <p className="mb-4">Seus dados podem ser compartilhados com:</p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li><strong>Prestadores de serviço:</strong> Stripe (pagamentos), fornecedores de lentes</li>
                                    <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                                    <li><strong>Profissionais médicos:</strong> Para continuidade do tratamento</li>
                                </ul>
                                <p>Não vendemos ou alugamos seus dados pessoais para terceiros.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">6. Seus Direitos</h2>
                                <p className="mb-4">Você tem direito a:</p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li>Confirmação da existência de tratamento</li>
                                    <li>Acesso aos dados</li>
                                    <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                                    <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                                    <li>Portabilidade dos dados</li>
                                    <li>Eliminação dos dados tratados com consentimento</li>
                                    <li>Revogação do consentimento</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">7. Cookies</h2>
                                <p className="mb-4">
                                    Utilizamos cookies para melhorar sua experiência. Você pode gerenciar suas
                                    preferências através do banner de cookies ou nas configurações do seu navegador.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">8. Segurança</h2>
                                <p className="mb-4">
                                    Implementamos medidas técnicas e organizacionais adequadas para proteger
                                    seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">9. Retenção de Dados</h2>
                                <p className="mb-4">
                                    Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas
                                    ou conforme exigido por lei. Dados médicos são mantidos conforme regulamentação
                                    do Conselho Federal de Medicina.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">10. Contato</h2>
                                <p className="mb-4">
                                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
                                </p>
                                <ul className="list-disc pl-6 mb-4">
                                    <li><strong>E-mail:</strong> <a href="mailto:privacidade@svlentes.com.br" className="text-blue-600 hover:underline">privacidade@svlentes.com.br</a></li>
                                    <li><strong>WhatsApp:</strong> Através do botão no site</li>
                                    <li><strong>Responsável:</strong> Dr. Philipe Saraiva Cruz (CRM 69.870)</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">11. Alterações</h2>
                                <p className="mb-4">
                                    Esta política pode ser atualizada periodicamente. Notificaremos sobre
                                    mudanças significativas através dos nossos canais de comunicação.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}