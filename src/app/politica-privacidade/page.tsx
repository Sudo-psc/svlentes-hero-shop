import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';

export const metadata: Metadata = {
    title: 'Política de Privacidade | SV Lentes - Assinatura de Lentes',
    description: 'Política de privacidade da SV Lentes em conformidade com a LGPD. Saiba como protegemos seus dados pessoais.',
    robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="page-shell page-shell--muted">
            <div className="page-shell-container page-shell-container--narrow">
                <div className="surface-panel space-y-8">
                    <div className="space-y-3 text-center">
                        <span className="section-heading__eyebrow">LGPD</span>
                        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                            Política de Privacidade
                        </h1>
                        <p className="text-sm text-slate-500">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </p>
                    </div>

                    <div className="space-y-10 text-slate-600">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">1. Informações Gerais</h2>
                            <p>
                                    A SV Lentes, sob responsabilidade médica do Dr. Philipe Saraiva Cruz
                                    (CRM 69.870), está comprometida com a proteção da privacidade e dos dados pessoais
                                    de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                                </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">2. Dados Coletados</h2>
                            <p>Coletamos os seguintes tipos de dados:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                    <li><strong>Dados de Identificação:</strong> Nome completo, CPF, data de nascimento</li>
                                    <li><strong>Dados de Contato:</strong> E-mail, telefone/WhatsApp, endereço completo</li>
                                    <li><strong>Dados Médicos:</strong> Prescrição oftalmológica, histórico de uso de lentes</li>
                                    <li><strong>Dados de Navegação:</strong> Cookies, endereço IP, dados de uso do site</li>
                                    <li><strong>Dados de Pagamento:</strong> Informações processadas pelo Stripe (não armazenamos dados de cartão)</li>
                                </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">3. Finalidades do Tratamento</h2>
                            <p>Utilizamos seus dados para:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                    <li>Prestação do serviço de assinatura de lentes de contato</li>
                                    <li>Acompanhamento médico oftalmológico</li>
                                    <li>Processamento de pagamentos e gestão de assinaturas</li>
                                    <li>Comunicação sobre seu tratamento e serviços</li>
                                    <li>Melhoria dos nossos serviços (com seu consentimento)</li>
                                    <li>Cumprimento de obrigações legais e regulatórias</li>
                                </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">4. Base Legal</h2>
                            <p>O tratamento dos seus dados é baseado em:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                    <li><strong>Execução de contrato:</strong> Para prestação dos serviços contratados</li>
                                    <li><strong>Consentimento:</strong> Para comunicações de marketing e análises</li>
                                    <li><strong>Legítimo interesse:</strong> Para melhoria dos serviços e segurança</li>
                                    <li><strong>Cumprimento legal:</strong> Para atender obrigações médicas e fiscais</li>
                                </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">5. Compartilhamento de Dados</h2>
                            <p>Seus dados podem ser compartilhados com:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                    <li><strong>Prestadores de serviço:</strong> Stripe (pagamentos), fornecedores de lentes</li>
                                    <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                                    <li><strong>Profissionais médicos:</strong> Para continuidade do tratamento</li>
                                </ul>
                            <p>Não vendemos ou alugamos seus dados pessoais para terceiros.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">6. Seus Direitos</h2>
                            <p>Você tem direito a:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                    <li>Confirmação da existência de tratamento</li>
                                    <li>Acesso aos dados</li>
                                    <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                                    <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                                    <li>Portabilidade dos dados</li>
                                    <li>Eliminação dos dados tratados com consentimento</li>
                                    <li>Revogação do consentimento</li>
                                </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">7. Cookies</h2>
                            <p>
                                Utilizamos cookies para melhorar sua experiência. Você pode gerenciar suas
                                preferências através do banner de cookies ou nas configurações do seu navegador.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">8. Segurança</h2>
                            <p>
                                Implementamos medidas técnicas e organizacionais adequadas para proteger
                                seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">9. Retenção de Dados</h2>
                            <p>
                                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas
                                ou conforme exigido por lei. Dados médicos são mantidos conforme regulamentação
                                do Conselho Federal de Medicina.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">10. Contato</h2>
                            <p>
                                Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
                            </p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>
                                    <strong>E-mail:</strong>{' '}
                                    <a
                                        href="mailto:privacidade@svlentes.com.br"
                                        className="font-medium text-primary-600 underline-offset-4 transition hover:underline"
                                    >
                                        privacidade@svlentes.com.br
                                    </a>
                                </li>
                                <li><strong>WhatsApp:</strong> Através do botão no site</li>
                                <li><strong>Responsável:</strong> Dr. Philipe Saraiva Cruz (CRM 69.870)</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">11. Alterações</h2>
                            <p>
                                Esta política pode ser atualizada periodicamente. Notificaremos sobre
                                mudanças significativas através dos nossos canais de comunicação.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}