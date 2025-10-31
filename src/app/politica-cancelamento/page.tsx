import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Cancelamento - SV Lentes | Assinatura de Lentes',
    description: 'Política de cancelamento do serviço de assinatura SV Lentes. Transparência e facilidade no cancelamento.',
    robots: 'index, follow',
}

export default function PoliticaCancelamentoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Política de Cancelamento
                    </h1>

                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-6">
                            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                        </p>

                        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-6 mb-8">
                            <h2 className="text-xl font-bold text-cyan-900 mb-3">
                                🎯 Compromisso com a Transparência
                            </h2>
                            <p className="text-cyan-800 leading-relaxed">
                                Na SV Lentes, acreditamos em relacionamentos de confiança. Você tem total liberdade
                                para cancelar sua assinatura a qualquer momento, sem burocracia e sem multas.
                            </p>
                        </div>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                1. Cancelamento Sem Multa
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Você pode cancelar sua assinatura a qualquer momento, pelos seguintes canais:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Área do Assinante:</strong> Acesse sua conta e solicite o cancelamento</li>
                                <li><strong>WhatsApp:</strong> (33) 99989-8026</li>
                                <li><strong>Email:</strong> cancelamento@svlentes.com.br</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed">
                                <strong>Importante:</strong> Não há taxa de cancelamento, multa rescisória ou cobrança adicional.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                2. Como Funciona o Cancelamento
                            </h2>
                            
                            <div className="bg-gray-50 p-6 rounded-lg mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Passo a Passo:
                                </h3>
                                <ol className="list-decimal list-inside text-gray-700 space-y-3">
                                    <li>
                                        <strong>Solicite o cancelamento</strong> através de um dos canais disponíveis
                                    </li>
                                    <li>
                                        <strong>Confirmação imediata:</strong> Você receberá confirmação em até 24 horas
                                    </li>
                                    <li>
                                        <strong>Cancelamento efetivado:</strong> No final do período de cobrança atual
                                    </li>
                                    <li>
                                        <strong>Sem cobranças futuras:</strong> Não haverá renovação automática
                                    </li>
                                </ol>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                3. Quando o Cancelamento é Efetivado
                            </h2>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                3.1. Durante o Período de Cobrança
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Se você cancelar durante o período de cobrança atual:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Você continuará tendo acesso aos serviços até o final do período pago</li>
                                <li>Não haverá cobrança no próximo ciclo de faturamento</li>
                                <li>Você poderá usar suas lentes e ter suporte médico até o término do período</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                3.2. Cancelamento Imediato
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Em casos específicos, você pode solicitar cancelamento imediato:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Problemas de saúde que impedem o uso de lentes (com atestado médico)</li>
                                <li>Mudança de localidade para região sem cobertura de entrega</li>
                                <li>Outras situações especiais analisadas caso a caso</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed">
                                Nesses casos, faremos o reembolso proporcional dos dias não utilizados.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                4. Reembolso Após Cancelamento
                            </h2>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                4.1. Cancelamento no Período de Arrependimento (7 dias)
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Conforme o Art. 49 do Código de Defesa do Consumidor:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Reembolso integral em até 10 dias úteis</li>
                                <li>Devolução de produtos não utilizados (se aplicável)</li>
                                <li>Sem questionamentos ou justificativas necessárias</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                4.2. Cancelamento Após 7 Dias
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Após o período de arrependimento:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Você utiliza os serviços até o final do período pago</li>
                                <li>Não há reembolso proporcional (exceto casos especiais mencionados)</li>
                                <li>Cancelamento de cobranças futuras garantido</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                5. Suspensão Temporária (Pausa na Assinatura)
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Se você não deseja cancelar definitivamente, oferecemos a opção de <strong>pausar sua assinatura</strong>:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Pausa de 1 a 6 meses:</strong> Ideal para viagens, tratamentos ou mudanças temporárias</li>
                                <li><strong>Sem cobrança durante a pausa:</strong> Você não paga nada enquanto a assinatura estiver suspensa</li>
                                <li><strong>Reativação fácil:</strong> Retome quando quiser, mantendo seu histórico e preferências</li>
                                <li><strong>Suporte médico preservado:</strong> Consultas emergenciais podem ser agendadas mesmo durante a pausa</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                6. Reativação de Assinatura Cancelada
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Mudou de ideia? Você pode reativar sua assinatura a qualquer momento:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Mesmo plano e condições anteriores (se disponível)</li>
                                <li>Histórico médico e prescrições mantidos</li>
                                <li>Sem taxa de reativação</li>
                                <li>Processo simplificado via área do assinante ou WhatsApp</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                7. O Que Acontece com Seus Dados
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Em conformidade com a LGPD (Lei Geral de Proteção de Dados):
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Dados médicos:</strong> Mantidos por 20 anos conforme resolução CFM nº 1.821/2007</li>
                                <li><strong>Dados cadastrais:</strong> Mantidos por tempo necessário para obrigações legais e fiscais</li>
                                <li><strong>Exclusão de dados:</strong> Você pode solicitar através do email privacidade@svlentes.com.br</li>
                                <li><strong>Comunicações de marketing:</strong> Cessam imediatamente após o cancelamento</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                8. Cancelamento por Nossa Iniciativa
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                A SV Lentes reserva-se o direito de cancelar assinaturas em casos de:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Inadimplência por mais de 30 dias</li>
                                <li>Uso fraudulento ou violação dos Termos de Uso</li>
                                <li>Impossibilidade técnica ou médica de continuar o serviço</li>
                            </ul>
                            <p className="text-gray-700 leading-relaxed">
                                Nesses casos, você será notificado com antecedência mínima de 30 dias,
                                exceto em situações de urgência ou fraude comprovada.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                9. Feedback e Melhoria Contínua
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Sua opinião é muito importante! Ao cancelar, pedimos que compartilhe o motivo:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Suas respostas são anônimas e confidenciais</li>
                                <li>Nos ajudam a melhorar nossos serviços</li>
                                <li>Não são obrigatórias para efetivar o cancelamento</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                10. Contato e Suporte
                            </h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700"><strong>SV Lentes - Serviços Oftalmológicos Especializados</strong></p>
                                <p className="text-gray-700">CNPJ: 53.864.119/0001-79</p>
                                <p className="text-gray-700">Endereço: Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG</p>
                                <p className="text-gray-700">CEP: 35300-299</p>
                                <p className="text-gray-700">WhatsApp: (33) 99989-8026</p>
                                <p className="text-gray-700">
                                    Email: <a href="mailto:cancelamento@svlentes.com.br" className="text-blue-600 hover:underline">cancelamento@svlentes.com.br</a>
                                </p>
                                <p className="text-gray-700 mt-2">
                                    <strong>Horário de atendimento:</strong> Segunda a Sexta, 8h às 18h
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                11. Legislação Aplicável
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Esta política está em conformidade com:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                                <li>Lei 8.078/1990 - Código de Defesa do Consumidor</li>
                                <li>Lei 13.709/2018 - Lei Geral de Proteção de Dados (LGPD)</li>
                                <li>Decreto 7.962/2013 - Comércio Eletrônico</li>
                                <li>Resolução CFM nº 1.821/2007 - Guarda de prontuários médicos</li>
                            </ul>
                        </section>

                        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-6 mt-8">
                            <p className="text-cyan-900 font-semibold mb-2">
                                💙 Esperamos que você não precise usar esta política!
                            </p>
                            <p className="text-cyan-800 leading-relaxed">
                                Mas se precisar, estamos aqui para tornar o processo simples, transparente e respeitoso.
                                Sua saúde ocular e satisfação são nossas prioridades.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
