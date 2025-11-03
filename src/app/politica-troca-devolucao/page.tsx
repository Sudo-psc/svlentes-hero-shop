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

                        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
                            <h2 className="text-xl font-bold text-red-900 mb-3">
                                ⚠️ POLÍTICA DE NÃO DEVOLUÇÃO E NÃO REEMBOLSO
                            </h2>
                            <p className="text-red-800 leading-relaxed font-semibold mb-2">
                                Por se tratar de produtos de saúde e higiene pessoal (lentes de contato),
                                <strong> NÃO realizamos devoluções nem reembolsos</strong>, exceto nas condições
                                legais abaixo descritas.
                            </p>
                            <p className="text-red-700 leading-relaxed">
                                Esta política segue as normas sanitárias da ANVISA e regulamentos de saúde
                                que proíbem a reutilização ou revenda de produtos de contato direto com os olhos.
                            </p>
                        </div>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                1. Direito de Arrependimento (Única Exceção Legal)
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Conforme o Art. 49 do Código de Defesa do Consumidor (CDC), você tem direito
                                de desistir da contratação no prazo de <strong>7 (sete) dias corridos</strong>,
                                contados a partir da assinatura do contrato ou do recebimento do produto.
                            </p>

                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                                    📋 Condições Obrigatórias para Devolução:
                                </h3>
                                <ul className="list-disc list-inside text-amber-800 space-y-1">
                                    <li><strong>Prazo máximo:</strong> 7 dias corridos</li>
                                    <li><strong>Embalagem:</strong> Lacrada e intacta (não pode ter sido aberta)</li>
                                    <li><strong>Estado:</strong> Produto sem uso e em condição de revenda</li>
                                    <li><strong>Nota fiscal:</strong> Original acompanhando o produto</li>
                                </ul>
                            </div>

                            <p className="text-gray-700 leading-relaxed font-semibold">
                                ⚠️ IMPORTANTE: Produtos com embalagem aberta ou usados NÃO serão aceitos,
                                mesmo dentro do prazo de 7 dias, por questões de segurança sanitária.
                            </p>

                            <p className="text-gray-700 leading-relaxed mt-4">
                                Para exercer o direito de arrependimento, entre em contato através do nosso
                                WhatsApp (33) 99989-8026 ou área do assinante. O reembolso será processado em até 10 dias úteis.
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
                                3. Política de Devolução Restritiva
                            </h2>

                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <h3 className="text-lg font-semibold text-red-900 mb-2">
                                    🚫 NÃO Aceitamos Devolução
                                </h3>
                                <p className="text-red-800 leading-relaxed mb-2">
                                    Por motivos de higiene, segurança sanitária e normas da ANVISA,
                                    <strong> NÃO aceitamos devolução</strong> de:
                                </p>
                                <ul className="list-disc list-inside text-red-800 space-y-2">
                                    <li><strong>Lentes com embalagem aberta ou violada</strong></li>
                                    <li><strong>Lentes usadas, mesmo que uma única vez</strong></li>
                                    <li><strong>Produtos de higiene e soluções abertas</strong></li>
                                    <li><strong>Lentes danificadas por uso inadequado</strong></li>
                                    <li><strong>Produtos fora do prazo de 7 dias</strong></li>
                                </ul>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                3.1. Única Exceção: Arrependimento Legal (7 dias)
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                A devolução será aceita APENAS nas seguintes condições:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>✅ Produto em <strong>embalagem original lacrada</strong></li>
                                <li>✅ <strong>Sem sinais de uso ou violação</strong></li>
                                <li>✅ Acompanhado da <strong>nota fiscal original</strong></li>
                                <li>✅ Dentro do prazo de <strong>7 dias corridos</strong> (CDC Art. 49)</li>
                            </ul>

                            <p className="text-gray-700 leading-relaxed font-semibold bg-yellow-50 p-3 rounded">
                                ⚠️ Atenção: Se qualquer uma dessas condições não for atendida, a devolução será recusada.
                                Não há exceções além do previsto em lei.
                            </p>
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
                                6. Política de Reembolso
                            </h2>

                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <h3 className="text-lg font-semibold text-red-900 mb-2">
                                    💰 Reembolso APENAS no Período Legal de 7 Dias
                                </h3>
                                <p className="text-red-800 leading-relaxed font-semibold">
                                    <strong>NÃO realizamos reembolsos</strong> após o período de arrependimento legal
                                    de 7 dias (CDC Art. 49), mesmo em caso de cancelamento da assinatura.
                                </p>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                6.1. Reembolso no Período de Arrependimento (7 dias)
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Se você exercer o direito de arrependimento dentro de 7 dias E o produto
                                estiver em embalagem lacrada, o reembolso será processado da seguinte forma:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li><strong>Cartão de crédito:</strong> estorno em até 2 faturas após confirmação da devolução</li>
                                <li><strong>Outros meios:</strong> transferência bancária em até 10 dias úteis</li>
                                <li><strong>Valor:</strong> integral do produto (frete de devolução por conta do cliente)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                6.2. Após 7 Dias: SEM Reembolso
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Após o período de 7 dias, <strong>não há direito a reembolso</strong> em nenhuma circunstância, incluindo:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                                <li>❌ Cancelamento de assinatura</li>
                                <li>❌ Desistência do serviço</li>
                                <li>❌ Mudança de endereço ou localidade</li>
                                <li>❌ Troca de plano ou preferências</li>
                                <li>❌ Qualquer outro motivo pessoal</li>
                            </ul>

                            <p className="text-gray-700 leading-relaxed bg-amber-50 p-3 rounded font-semibold">
                                ℹ️ Cancelamento de Assinatura: Ao cancelar, você utiliza os serviços até o final do
                                período já pago. Não há reembolso proporcional de dias não utilizados.
                            </p>
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
