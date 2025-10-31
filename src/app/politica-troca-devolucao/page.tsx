import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Política de Troca e Devolução - SV Lentes | Serviço de Assinatura',
    description: 'Política de troca e devolução da SV Lentes em conformidade com o Código de Defesa do Consumidor.',
    robots: 'index, follow',
}

export default function PoliticaTrocaDevolucaoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        Política de Troca e Devolução
                    </h1>

                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-6">
                            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                1. Direito de Arrependimento
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Conforme o Art. 49 do Código de Defesa do Consumidor (CDC), você tem direito
                                de desistir da contratação no prazo de <strong>7 (sete) dias corridos</strong>,
                                contados a partir da assinatura do contrato ou do recebimento do produto.
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                Para exercer o direito de arrependimento, entre em contato através do nosso
                                WhatsApp ou área do assinante. O reembolso será processado em até 10 dias úteis.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                2. Troca de Lentes
                            </h2>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                2.1. Defeito de Fabricação
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Lentes com defeito de fabricação podem ser trocadas gratuitamente em até
                                <strong> 30 dias</strong> após o recebimento, desde que:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>A lente esteja em sua embalagem original lacrada</li>
                                <li>O defeito seja comprovadamente de fabricação</li>
                                <li>A lente não tenha sido usada ou danificada pelo cliente</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                2.2. Erro na Prescrição ou Grau
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Em caso de erro na prescrição ou envio de grau incorreto:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Se o erro for nosso: troca gratuita em até 5 dias úteis</li>
                                <li>Se houver mudança de grau prescrita pelo médico: sujeita à análise e aprovação</li>
                                <li>Primeira troca gratuita; trocas adicionais podem ter custo</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                2.3. Desconforto ou Inadaptação
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Casos de desconforto ou dificuldade de adaptação devem ser reportados ao
                                Dr. Philipe Saraiva Cruz (CRM 69.870) para avaliação médica:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Consulta de avaliação sem custo adicional</li>
                                <li>Possível ajuste de prescrição ou troca de modelo</li>
                                <li>Prazo de até 15 dias para adaptação antes de solicitar troca</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                3. Devolução de Produto
                            </h2>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                3.1. Condições para Devolução
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                A devolução será aceita nas seguintes condições:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Produto em embalagem original lacrada</li>
                                <li>Sem sinais de uso ou dano</li>
                                <li>Acompanhado da nota fiscal</li>
                                <li>Dentro do prazo de 7 dias (arrependimento) ou 30 dias (defeito)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                3.2. Produtos NÃO Elegíveis para Devolução
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Por motivos de higiene e segurança sanitária, NÃO aceitamos devolução de:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>Lentes com embalagem aberta e/ou usadas (exceto defeito de fabricação)</li>
                                <li>Lentes danificadas por uso inadequado</li>
                                <li>Produtos de higiene e soluções abertas</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                4. Processo de Troca/Devolução
                            </h2>
                            
                            <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 mb-4">
                                <h3 className="text-lg font-semibold text-cyan-900 mb-2">
                                    Passo a Passo:
                                </h3>
                                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                                    <li>Entre em contato via WhatsApp (33) 99989-8026 ou área do assinante</li>
                                    <li>Informe o motivo da troca/devolução e número do pedido</li>
                                    <li>Envie fotos do produto (se aplicável)</li>
                                    <li>Aguarde autorização e instruções de envio</li>
                                    <li>Embale o produto adequadamente e envie para o endereço fornecido</li>
                                    <li>Após análise, processaremos a troca ou reembolso em até 10 dias úteis</li>
                                </ol>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                5. Custos de Frete
                            </h2>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Defeito de fabricação ou erro nosso:</strong> frete de devolução e reenvio por nossa conta</li>
                                <li><strong>Arrependimento (CDC Art. 49):</strong> frete de devolução por conta do cliente</li>
                                <li><strong>Mudança de grau/prescrição:</strong> sujeito à análise caso a caso</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                6. Reembolso
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                O reembolso será processado da seguinte forma:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Cartão de crédito:</strong> estorno em até 2 faturas após confirmação</li>
                                <li><strong>Outros meios:</strong> transferência bancária em até 10 dias úteis</li>
                                <li>Valor integral devolvido (produto + frete pago, quando aplicável)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                7. Garantia Legal
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Conforme o CDC (Art. 26), você tem os seguintes prazos para reclamar de vícios:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Vícios aparentes:</strong> 90 dias para produtos duráveis</li>
                                <li><strong>Vícios ocultos:</strong> prazo inicia quando o problema se manifesta</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                8. Exceções e Casos Especiais
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Em situações especiais de saúde ocular ou necessidade médica comprovada,
                                analisaremos cada caso individualmente com suporte do Dr. Philipe Saraiva Cruz
                                para encontrar a melhor solução.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                9. Contato
                            </h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700"><strong>SV Lentes - Serviços Oftalmológicos Especializados</strong></p>
                                <p className="text-gray-700">CNPJ: 53.864.119/0001-79</p>
                                <p className="text-gray-700">Endereço: Rua Catarina Maria Passos, 97 - Santa Zita, Caratinga/MG</p>
                                <p className="text-gray-700">CEP: 35300-299</p>
                                <p className="text-gray-700">WhatsApp: (33) 99989-8026</p>
                                <p className="text-gray-700">
                                    Email: <a href="mailto:trocas@svlentes.com.br" className="text-blue-600 hover:underline">trocas@svlentes.com.br</a>
                                </p>
                                <p className="text-gray-700 mt-2">
                                    <strong>Horário de atendimento:</strong> Segunda a Sexta, 8h às 18h
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                10. Legislação Aplicável
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Esta política está em conformidade com:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                                <li>Lei 8.078/1990 - Código de Defesa do Consumidor</li>
                                <li>Lei 13.709/2018 - Lei Geral de Proteção de Dados (LGPD)</li>
                                <li>Decreto 7.962/2013 - Comércio Eletrônico</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
