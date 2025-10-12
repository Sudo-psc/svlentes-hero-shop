import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Termos de Uso - SV Lentes | Assinatura de Lentes com Acompanhamento Médico',
    description: 'Termos de uso do serviço de assinatura de lentes de contato da SV Lentes com acompanhamento médico especializado.',
    robots: 'index, follow',
}

export default function TermosUsoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>

                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-6">
                            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Ao utilizar os serviços de assinatura de lentes de contato da SV Lentes - Serviços Oftalmológicos Especializados,
                                você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
                                não deve utilizar nossos serviços.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                A SV Lentes oferece um serviço de assinatura de lentes de contato com acompanhamento médico especializado,
                                sob supervisão do Dr. Philipe Saraiva Cruz (CRM 69.870).
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                Nossos serviços incluem:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                                <li>Consultas oftalmológicas especializadas</li>
                                <li>Prescrição e fornecimento de lentes de contato</li>
                                <li>Acompanhamento médico regular</li>
                                <li>Entrega domiciliar das lentes</li>
                                <li>Suporte técnico e orientações</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Responsabilidade Médica</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Todos os serviços médicos são prestados pelo Dr. Philipe Saraiva Cruz, médico oftalmologista
                                devidamente registrado no Conselho Regional de Medicina de São Paulo sob o número CRM 69.870.
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                O uso de lentes de contato requer prescrição médica e acompanhamento profissional.
                                É responsabilidade do usuário seguir todas as orientações médicas fornecidas.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Assinatura e Pagamento</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Nossos planos de assinatura são cobrados mensalmente, conforme o plano escolhido:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-1">
                                <li><strong>Plano Básico:</strong> Entrega trimestral com consulta semestral</li>
                                <li><strong>Plano Premium:</strong> Entrega mensal com consulta trimestral</li>
                                <li><strong>Plano VIP:</strong> Entrega quinzenal com consulta mensal</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed mt-4">
                                Os pagamentos são processados automaticamente através de cartão de crédito ou débito.
                                Você pode cancelar sua assinatura a qualquer momento sem multas.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancelamento e Reembolso</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Você pode cancelar sua assinatura a qualquer momento através do nosso WhatsApp ou área do cliente.
                                O cancelamento será efetivo no final do período de cobrança atual.
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                Reembolsos são processados conforme o Código de Defesa do Consumidor brasileiro,
                                especialmente nos casos de arrependimento em até 7 dias da contratação.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacidade e Proteção de Dados</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Respeitamos sua privacidade e protegemos seus dados pessoais conforme a Lei Geral de Proteção
                                de Dados (LGPD). Para mais informações, consulte nossa
                                <a href="/politica-privacidade" className="text-blue-600 hover:underline ml-1">
                                    Política de Privacidade
                                </a>.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
                            <p className="text-gray-700 leading-relaxed">
                                A SV Lentes não se responsabiliza por danos decorrentes do uso inadequado das lentes de contato
                                ou descumprimento das orientações médicas. É fundamental seguir todas as instruções de uso,
                                higiene e manutenção fornecidas pelo médico responsável.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Alterações nos Termos</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Reservamo-nos o direito de modificar estes termos a qualquer momento.
                                As alterações serão comunicadas através do nosso site e por email.
                                O uso continuado dos serviços após as alterações constitui aceitação dos novos termos.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contato</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Para dúvidas sobre estes Termos de Uso, entre em contato conosco:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700"><strong>SV Lentes - Serviços Oftalmológicos Especializados</strong></p>
                                <p className="text-gray-700">CNPJ: 12.345.678/0001-90</p>
                                <p className="text-gray-700">Endereço: Rua Joaquim Floriano, 466 - Itaim Bibi, São Paulo, SP</p>
                                <p className="text-gray-700">CEP: 04534-002</p>
                                <p className="text-gray-700">WhatsApp: (11) 94703-8078</p>
                                <p className="text-gray-700">Email: <a href="mailto:contato@svlentes.com.br" className="text-blue-600 hover:underline">contato@svlentes.com.br</a></p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Lei Aplicável</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Estes Termos de Uso são regidos pelas leis brasileiras.
                                Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}