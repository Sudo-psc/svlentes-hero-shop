'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Política de Privacidade</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="p-2"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="prose max-w-none">
                        <p className="text-sm text-gray-600 mb-6">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </p>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">1. Informações Gerais</h3>
                            <p className="mb-4">
                                A SV Lentes, sob responsabilidade médica do Dr. Philipe Saraiva Cruz
                                (CRM 65.870), está comprometida com a proteção da privacidade e dos dados pessoais
                                de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">2. Dados Coletados</h3>
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
                            <h3 className="text-lg font-semibold mb-4">3. Finalidades do Tratamento</h3>
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
                            <h3 className="text-lg font-semibold mb-4">4. Base Legal</h3>
                            <p className="mb-4">O tratamento dos seus dados é baseado em:</p>
                            <ul className="list-disc pl-6 mb-4">
                                <li><strong>Execução de contrato:</strong> Para prestação dos serviços contratados</li>
                                <li><strong>Consentimento:</strong> Para comunicações de marketing e análises</li>
                                <li><strong>Legítimo interesse:</strong> Para melhoria dos serviços e segurança</li>
                                <li><strong>Cumprimento legal:</strong> Para atender obrigações médicas e fiscais</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">5. Compartilhamento de Dados</h3>
                            <p className="mb-4">Seus dados podem ser compartilhados com:</p>
                            <ul className="list-disc pl-6 mb-4">
                                <li><strong>Prestadores de serviço:</strong> Stripe (pagamentos), fornecedores de lentes</li>
                                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                                <li><strong>Profissionais médicos:</strong> Para continuidade do tratamento</li>
                            </ul>
                            <p>Não vendemos ou alugamos seus dados pessoais para terceiros.</p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">6. Seus Direitos</h3>
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
                            <h3 className="text-lg font-semibold mb-4">7. Cookies</h3>
                            <p className="mb-4">
                                Utilizamos cookies para melhorar sua experiência. Você pode gerenciar suas
                                preferências através do banner de cookies ou nas configurações do seu navegador.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">8. Segurança</h3>
                            <p className="mb-4">
                                Implementamos medidas técnicas e organizacionais adequadas para proteger
                                seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">9. Retenção de Dados</h3>
                            <p className="mb-4">
                                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas
                                ou conforme exigido por lei. Dados médicos são mantidos conforme regulamentação
                                do Conselho Federal de Medicina.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">10. Contato</h3>
                            <p className="mb-4">
                                Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li><strong>E-mail:</strong> <a href="mailto:privacidade@svlentes.com.br" className="text-blue-600 hover:underline">privacidade@svlentes.com.br</a></li>
                                <li><strong>WhatsApp:</strong> Através do botão no site</li>
                                <li><strong>Responsável:</strong> Dr. Philipe Saraiva Cruz (CRM 65.870)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">11. Alterações</h3>
                            <p className="mb-4">
                                Esta política pode ser atualizada periodicamente. Notificaremos sobre
                                mudanças significativas através dos nossos canais de comunicação.
                            </p>
                        </section>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <Button onClick={onClose} className="w-full">
                        Entendi
                    </Button>
                </div>
            </div>
        </div>
    );
}