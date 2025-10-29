import 'dotenv/config'

import {createClient} from '@sanity/client'

interface ExistingArticle {
  _id: string
  coverImage?: {
    asset?: {
      _ref: string
    }
    sourceUrl?: string
  }
  publishedAt?: string
}

const assertEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

const projectId = assertEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = assertEnv('NEXT_PUBLIC_SANITY_DATASET')
const token = process.env.SANITY_API_TOKEN ?? process.env.SANITY_WRITE_TOKEN

if (!token) {
  throw new Error('Missing environment variable: SANITY_API_TOKEN or SANITY_WRITE_TOKEN')
}

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2025-10-24'

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion,
  useCdn: false,
})

const slug = 'meibografia-plugs-lacrimais-tratamento-olho-seco-caratinga-mg'
const articleId = `article-${slug}`
const coverImageUrl = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80'
const coverImageAlt = 'Oftalmologista realizando exame com lâmpada de fenda em consultório moderno'
const coverImageCaption = 'Tecnologia avançada aplicada aos cuidados com a saúde ocular em Caratinga, MG'
const metaTitle = 'Meibografia e Plugs Lacrimais: Tratamento Avançado para Olho Seco em Caratinga, MG'
const metaDescription = 'Descubra como a meibografia e os plugs lacrimais devolvem o conforto visual no tratamento do olho seco em Caratinga com o Dr. Philipe Saraiva Cruz na Clínica Saraiva Vision.'
const excerpt = 'Descubra como a meibografia e os plugs lacrimais oferecem diagnóstico preciso e tratamento eficaz para olho seco em Caratinga, MG, com acompanhamento humanizado da Clínica Saraiva Vision.'
const keywords = [
  'meibografia',
  'plugs lacrimais',
  'olho seco',
  'tratamento olho seco',
  'Caratinga MG',
  'disfunção glândulas de Meibômio',
  'Dr. Philipe Saraiva Cruz',
]
const references = [
  'https://phelcom.com/pt-br/blog/inovacao/meibografia-para-diagnostico-de-olho-seco/',
  'https://oftalmologiapereiragomes.com.br/plug-lacrimal-para-o-tratamento-do-olho-seco/',
  'https://www.scielo.br/j/rbof/a/MwGmVx55FRBh7CBPZQNZRBn/',
  'https://sbop.com.br/paciente/doenca/disfuncao-das-glandulas-de-meibomius/',
  'https://www.midori.med.br/notas/plug-lacrimal-olho-seco',
]
const content = `# **Meibografia e Plugs Lacrimais: Tratamento Avançado para Olho Seco em Caratinga, MG**

## **Diagnóstico preciso e soluções eficazes para recuperar o conforto dos seus olhos**

***

## **Introdução**

Sentir os olhos ardendo, com sensação de areia, vermelhidão ou cansaço visual pode ser mais do que um simples incômodo passageiro. Esses sintomas podem indicar a **síndrome do olho seco**, uma condição que afeta milhões de brasileiros e compromete significativamente a qualidade de vida. Estudos mostram que a prevalência de olho seco no Brasil é de 12,8% na população geral, sendo mais frequente em áreas urbanas (38,1%) do que rurais (20%), e afetando predominantemente mulheres.[1][2][3][4]

Na **Clínica Saraiva Vision**, em Caratinga (MG), o **Dr. Philipe Saraiva Cruz (CRM-MG 69.870)** e sua equipe oferecem atendimento humanizado e tecnologia diagnóstica avançada para identificar as causas do olho seco e propor tratamentos personalizados.

Neste artigo, você vai entender como a **meibografia** — um exame moderno que avalia as glândulas responsáveis pela camada lipídica da lágrima — auxilia no diagnóstico preciso do olho seco evaporativo. Além disso, vamos explorar o tratamento com **plugs lacrimais**, pequenos dispositivos que ajudam a preservar a lágrima na superfície ocular, e compará-lo rapidamente com outras opções terapêuticas disponíveis.[5][6][7][8]

***

## **O que é a Síndrome do Olho Seco?**

A síndrome do olho seco é uma doença multifatorial que ocorre quando há alteração na quantidade ou na qualidade das lágrimas. O filme lacrimal é composto por três camadas principais: **lipídica** (gordura), **aquosa** (água) e **mucínica** (mucina). Qualquer desequilíbrio nessa composição pode levar ao ressecamento da superfície ocular.[9][10][11]

A camada lipídica, com espessura de 50-100 nanômetros, é produzida pelas glândulas de Meibômio e tem função crucial na prevenção da evaporação lacrimal. A camada aquosa, secretada principalmente pela glândula lacrimal, contém proteínas, eletrólitos e fatores de crescimento essenciais para a saúde ocular. Já a camada mucínica, produzida pelas células caliciformes da conjuntiva, permite que a lágrima adira à superfície ocular.[10][11][9]

### **Principais causas do olho seco:**

* Envelhecimento natural
* Alterações hormonais (menopausa, andropausa)
* Uso prolongado de telas (computador, celular, tablets) — associado ao olho seco em usuários com mais de 6 horas diárias de exposição[2][1]
* Ambientes com ar-condicionado ou baixa umidade
* Uso de lentes de contato
* Medicamentos (antidepressivos, anti-histamínicos, anti-hipertensivos)[1][2]
* Doenças autoimunes (síndrome de Sjögren, artrite reumatoide, lúpus)[12]
* Disfunção das glândulas de Meibômio[13][5]

### **Sintomas mais comuns:**

* Ardência e queimação
* Sensação de areia ou corpo estranho
* Vermelhidão
* Visão embaçada que melhora ao piscar
* Sensibilidade à luz (fotofobia)
* Lacrimejamento excessivo (paradoxalmente)
* Cansaço visual após leitura ou uso de telas

***

## **Meibografia: O Exame que Revela a Saúde das Glândulas de Meibômio**

### **O que são as glândulas de Meibômio?**

As glândulas de Meibômio estão localizadas nas pálpebras superiores e inferiores, sendo compostas por células acinares conectadas a um ducto central que se abre na margem palpebral. Elas produzem o **meibum**, uma secreção lipídica essencial que forma a camada lipídica do filme lacrimal. Esta camada é responsável por evitar a evaporação rápida das lágrimas e manter a estabilidade do filme lacrimal.[6][13]

Quando essas glândulas não funcionam adequadamente — condição conhecida como **disfunção das glândulas de Meibômio (DGM)** —, ocorre o olho seco evaporativo. A DGM é a principal causa de olho seco, sendo responsável por aproximadamente **86% dos casos de doença do olho seco**, e o olho seco evaporativo representa até 85% de todos os casos de olho seco.[14][5]

### **Como funciona a meibografia?**

A **meibografia** é um exame não invasivo que utiliza luz infravermelha para visualizar a anatomia das glândulas de Meibômio in vivo. O procedimento é rápido, indolor e não requer dilatação das pupilas ou anestesia.[15][5][6]

**Passo a passo do exame:**

1. O paciente se posiciona confortavelmente em frente ao equipamento
2. O oftalmologista captura imagens das pálpebras superiores e inferiores utilizando tecnologia de imagem infravermelha
3. As imagens revelam a estrutura, integridade e possíveis obstruções ou atrofia das glândulas[5][6]
4. O médico analisa o grau de perda glandular (dropout) e planeja o tratamento adequado[5]

### **Por que a meibografia é importante?**

A meibografia permite identificar precocemente a disfunção das glândulas de Meibômio, mesmo antes do aparecimento de sintomas graves. A perda de glândulas de Meibômio está significativamente correlacionada com outras características clínicas da DGM, como a qualidade do meibum expresso, alteração da estabilidade da camada lipídica do filme lacrimal e dano à superfície ocular.[6][5]

Com o diagnóstico preciso através da meibografia, o oftalmologista pode indicar o tratamento mais eficaz para cada caso, evitando a progressão da doença e melhorando significativamente o conforto ocular do paciente.[16][6][5]

***

## **Plugs Lacrimais: Solução Eficaz para Olho Seco por Deficiência Aquosa**

### **O que são plugs lacrimais?**

Os **plugs lacrimais** (ou tampões punctais) são pequenos dispositivos biocompatíveis inseridos nos pontos lacrimais — pequenas aberturas localizadas no canto interno das pálpebras superiores e/ou inferiores. Sua função é bloquear a drenagem das lágrimas, mantendo-as por mais tempo na superfície ocular e proporcionando maior hidratação.[7][8][17]

### **Tipos de plugs lacrimais:**

**Plugs temporários (absorvíveis):**
* Feitos de colágeno
* Duram de algumas semanas a alguns meses
* Indicados para testes iniciais ou tratamentos de curto prazo[7]

**Plugs permanentes (não absorvíveis):**
* Feitos de silicone ou acrílico
* Podem permanecer indefinidamente
* Podem ser removidos se necessário[8][7]
* Indicados para casos crônicos de olho seco

**Plugs termossensíveis (Smart Plugs):**
* Feitos de material acrílico hidrofóbico termossensível[18][19][20]
* Sólidos à temperatura ambiente (0,4 mm de diâmetro e 6 mm de comprimento) mas tornam-se gel macio à temperatura corporal[19][18]
* Expandem-se e encurtam-se com o aquecimento corporal (até 1 mm de diâmetro e 1,5 mm de comprimento)[19]
* Ajustam-se à anatomia exata do ponto lacrimal sem necessidade de dilatação prévia[21][18]
* Apresentam taxa de retenção excepcionalmente alta de **97,3%**[22][8]

### **Quando os plugs lacrimais são indicados?**

* Olho seco moderado a grave por deficiência aquosa[17][8][7]
* Pacientes que não respondem adequadamente a colírios lubrificantes[17][7]
* Síndrome de Sjögren e outras doenças autoimunes[23][12][7]
* Olho seco pós-cirurgia refrativa ou de catarata[7]
* Uso crônico de lentes de contato com desconforto
* Drenagem lacrimal acelerada[7]

### **Como é feito o implante de plugs lacrimais?**

O procedimento é simples, rápido e realizado no próprio consultório:

1. Aplicação de colírio anestésico
2. Inserção do plug no ponto lacrimal com instrumento específico
3. Verificação do posicionamento adequado
4. Orientações pós-procedimento

O paciente pode retomar suas atividades normais imediatamente após o implante.[7]

### **Benefícios dos plugs lacrimais:**

Estudos recentes demonstram que os plugs lacrimais oferecem benefícios significativos e bem documentados:[8][17][7]

* **Melhora dos sintomas**: Redução ≥50% nos sintomas de olho seco[7]
* **Melhora objetiva**: Aumento significativo no tempo de ruptura do filme lacrimal (TBUT) em média de 1,8 segundos[22][8]
* **Aumento da produção lacrimal**: Melhora no teste de Schirmer de 3,1 mm em média[8][22]
* **Redução de danos à superfície ocular**: Diminuição significativa da coloração por fluoresceína e rosa bengala[22][8][7]
* **Redução da necessidade de colírios lubrificantes**: Mais de 55% dos pacientes reduzem a dependência de lágrimas artificiais[20][7]
* **Procedimento minimamente invasivo e reversível**: Pode ser revertido se necessário[7]
* **Resultados visíveis em poucos dias**: Melhora clínica observada dentro de 60 dias[24]
* **Alta taxa de retenção**: Taxa média de retenção de 86%, com smart plugs atingindo 97,3%[8][22]

### **Possíveis complicações (raras):**

As complicações com plugs lacrimais são infrequentes e geralmente leves:[8][7]

* **Extrusão espontânea do plug**: Ocorre em aproximadamente 25-50% dos casos com plugs de silicone convencionais ao longo de meses a anos, sendo significativamente menor com smart plugs[25][26]
* **Lacrimejamento excessivo (epífora)**: Reportado em cerca de 9-15% dos pacientes[24][7]
* **Sensação de corpo estranho**: Ocorre em aproximadamente 10% dos casos, podendo requerer remoção[7]
* **Granuloma piogênico**: Complicação rara (<1%)[24]
* **Canaliculite**: Mais comum com plugs intracanaliculares, ocorrendo em aproximadamente 8% dos casos[7]
* **Infecção**: Muito rara (<0,5%)[24]

***

## **Comparação Rápida: Plugs Lacrimais vs. Outros Tratamentos para Olho Seco**

| **Tratamento** | **Indicação Principal** | **Vantagens** | **Desvantagens** |
|:---|:---|:---|:---|
| **Colírios lubrificantes** | Olho seco leve a moderado | Fácil acesso, sem procedimento, baixo custo | Uso frequente necessário, efeito temporário, possível toxicidade por conservantes |
| **Plugs lacrimais** | Deficiência aquosa moderada a grave[7][8][17] | Efeito prolongado, reduz uso de colírios em >55% dos pacientes[20], alta taxa de retenção (86-97%)[8][22] | Requer procedimento, risco de extrusão (25-50% com plugs convencionais)[25], custo inicial |
| **Ciclosporina tópica 0,05%** | Olho seco inflamatório moderado a grave[27][28][29] | Reduz inflamação, aumenta produção de lágrima, efeito imunomodulador | Demora 3-6 meses para efeito máximo, sensação de queimação em 21,8%[28], custo elevado |
| **Lifitegrast 5%** | Olho seco inflamatório moderado a grave[27][28][30][31] | Alívio sintomático mais rápido que ciclosporina[28], melhora OSDI em média 21,6 pontos[28], melhor tolerabilidade | Custo elevado, gosto desagradável relatado por alguns pacientes |
| **Luz pulsada intensa (IPL)** | Disfunção de glândulas de Meibômio[32][33][34][35] | Melhora qualidade lipídica e função glandular em 77%[33], efeito duradouro, redução de sintomas em 89%[33] | Múltiplas sessões necessárias (3-5), custo elevado, contraindicado em peles escuras, resultados variáveis |
| **Soro autólogo** | Olho seco grave refratário, síndrome de Sjögren[36][37][38][39] | Rico em fatores de crescimento, superior a lágrimas artificiais[38], propriedades antibacterianas e anti-inflamatórias[37] | Preparo especial necessário, custo elevado, armazenamento em freezer, disponibilidade limitada |
| **Limpeza palpebral** | Blefarite, disfunção de Meibômio leve[40][41] | Simples, pode ser feita em casa, baixo custo | Requer disciplina diária, efeito limitado em casos graves |
| **Cauterização punctal** | Olho seco grave com perda repetida de plugs[42][43][44][45] | Oclusão permanente, elimina necessidade de recolocação | Irreversível (exceto em 21% com recanalização)[43][45], risco de epífora permanente |

### **Quando escolher plugs lacrimais?**

Os plugs lacrimais são especialmente indicados quando:[17][8][7]

* O uso de colírios lubrificantes não é suficiente para controle dos sintomas
* Há necessidade de aplicar lágrimas artificiais mais de 4-6 vezes ao dia
* O paciente apresenta deficiência aquosa confirmada por exames (Schirmer <10 mm ou <5 mm com anestesia)[16]
* Existe drenagem lacrimal acelerada
* O paciente busca uma solução de longo prazo com alta eficácia comprovada

***

## **Outros Tratamentos Complementares para Olho Seco**

### **Luz pulsada intensa (IPL)**

A terapia com luz pulsada intensa é indicada especificamente para pacientes com disfunção das glândulas de Meibômio. Estudos recentes demonstram que o IPL, especialmente quando combinado com expressão das glândulas meibomianas (MGX), pode melhorar significativamente os sintomas e sinais do olho seco.[32][33][34][35]

Em um estudo retrospectivo realizado na Mayo Clinic, 89% dos pacientes apresentaram melhora dos sintomas após tratamento com IPL/MGX, sendo que 23% tiveram redução ≥50% nos escores de sintomas. A função das glândulas meibomianas melhorou em 77% dos pacientes em pelo menos um olho. O tratamento utiliza pulsos de luz para estimular as glândulas, melhorar a qualidade da secreção lipídica e reduzir a inflamação palpebral. São necessárias tipicamente de 3 a 5 sessões espaçadas de 2 a 4 semanas para resultados eficazes.[33][34][35][46][32]

### **Higiene palpebral**

A limpeza diária das pálpebras com produtos específicos ajuda a remover crostas, detritos e secreções que obstruem as glândulas de Meibômio. Compressas mornas (temperatura ideal acima de 40°C para derreter o meibum alterado) seguidas de massagem palpebral também auxiliam na desobstrução glandular. Estudos demonstram que compressas mornas proporcionam alívio sintomático quando realizadas segundo protocolo rigoroso.[40][41]

### **Suplementação com ômega-3**

Estudos indicam que a ingestão de ácidos graxos ômega-3 (presentes em peixes como salmão e sardinha, e em sementes de chia e linhaça) possui ação anti-inflamatória e melhora a qualidade da lágrima. Uma meta-análise recente incluindo 19 ensaios clínicos randomizados com 4.246 pacientes demonstrou que a suplementação com ômega-3 melhora significativamente os sintomas subjetivos de olho seco (OSDI), tempo de ruptura do filme lacrimal (TBUT), teste de Schirmer e osmolaridade.[47][48][49]

Os ácidos graxos ômega-3 são convertidos em substâncias anti-inflamatórias potentes conhecidas como resolvinas e protectinas. Além disso, aparecem melhorar a qualidade da camada lipídica do filme lacrimal através da resolução da disfunção das glândulas meibomianas e do aumento da produção lacrimal pela glândula lacrimal. No entanto, é importante notar que o maior estudo controlado (DREAM study) com 545 pacientes não encontrou diferença entre ômega-3 e placebo após 12 meses, especialmente quando combinado com outros tratamentos para olho seco.[48][50]

### **Colírios imunomoduladores**

**Ciclosporina A**: Medicamento aprovado pela FDA que reduz a inflamação da superfície ocular e estimula a produção de lágrimas. Formulações eficazes incluem ciclosporina 0,05% gel, nanoemulsões de ciclosporina, ciclosporina sem água, e combinações de ciclosporina com lubrificantes como ácido hialurônico. O efeito máximo geralmente é observado após 3-6 meses de uso. A principal desvantagem é a sensação de queimação ao uso, relatada por 21,8% dos pacientes.[27][28][29][30][51]

**Lifitegrast 5%**: Antagonista da molécula de adesão LFA-1 (antígeno-1 associado à função de linfócitos) aprovado pela FDA. Estudos comparativos mostram que o lifitegrast demonstra redução significativamente maior nos escores OSDI na semana 12 (21,6 ± 4,2) comparado à ciclosporina (25,7 ± 4,1; p < 0,001). O teste de Schirmer também mostrou maior melhora no grupo lifitegrast (11,1 ± 1,5 mm) versus ciclosporina (10,2 ± 1,4 mm; p = 0,002). O lifitegrast oferece alívio sintomático mais rápido e melhor tolerabilidade.[28][30][31]

***

## **Quando Devo Procurar o Oftalmologista?**

### **Sinais de alerta:**

* Sintomas de olho seco que persistem por mais de duas semanas
* Piora progressiva dos sintomas
* Dor ocular intensa
* Visão embaçada que não melhora ao piscar
* Vermelhidão persistente
* Secreção ocular excessiva
* Dificuldade para abrir os olhos pela manhã
* Sensibilidade extrema à luz

**Importante:** O olho seco não tratado pode evoluir para complicações graves. Aproximadamente 10% dos pacientes com olho seco significativo têm síndrome de Sjögren subjacente, e cerca de 85% dos pacientes com síndrome de Sjögren apresentam doença do olho seco grave ou muito grave. Complicações como ceratite, úlceras de córnea e cicatrizes que comprometem a visão podem ocorrer, sendo que em um estudo de acompanhamento, 9,9% dos pacientes experimentaram complicações corneanas potencialmente ameaçadoras da visão, incluindo defeitos/ulceração epitelial corneana e perfuração/derretimento corneano. Por isso, o acompanhamento oftalmológico regular é fundamental.[12][23]

***

## **Próximos Passos: Cuide da Saúde dos Seus Olhos**

Se você sofre com sintomas de olho seco, não deixe que o desconforto comprometa sua qualidade de vida. Na **Clínica Saraiva Vision**, em Caratinga (MG), você encontra:

* **Consultas oftalmológicas completas** com o Dr. Philipe Saraiva Cruz (CRM-MG 69.870) e equipe qualificada
* **Exames diagnósticos avançados**, incluindo meibografia para avaliação precisa da função das glândulas de Meibômio
* **Tratamentos personalizados** para olho seco baseados em evidências científicas, desde colírios até implante de plugs lacrimais
* **Adaptação de lentes de contato** para casos específicos
* **Atendimento humanizado** e acolhedor

### **Agende sua consulta:**

📞 **(33) 99860-1427**

Não espere os sintomas piorarem. Cuidar dos seus olhos é cuidar da sua qualidade de vida!

***

## **Box de Prova Social**

> **"Sofri anos com olho seco e ardência constante. Após o diagnóstico com meibografia e o implante de plugs lacrimais na Clínica Saraiva Vision, minha vida mudou completamente. Hoje consigo trabalhar no computador sem desconforto!"**
> — *Maria S., 52 anos, paciente da Clínica Saraiva Vision*

**Dados institucionais:**
* Tecnologia diagnóstica de ponta
* Equipe especializada em doenças da superfície ocular
* Atendimento baseado em evidências científicas

***

## **FAQ — Perguntas Frequentes**

**1. A meibografia dói?**

Não. A meibografia é um exame totalmente indolor e não invasivo. Utiliza luz infravermelha para visualizar as glândulas de Meibômio sem contato direto com o olho. Não requer anestesia, dilatação das pupilas e o procedimento dura apenas alguns minutos.[6][5]

**2. Os plugs lacrimais são permanentes?**

Existem plugs temporários (absorvíveis de colágeno) e permanentes (de silicone ou acrílico). Os plugs permanentes podem durar anos e ser removidos pelo oftalmologista se necessário, tornando o tratamento reversível. Smart plugs feitos de material acrílico termossensível apresentam taxa de retenção excepcionalmente alta de 97,3%.[20][19][22][8][7]

**3. Quanto tempo dura o efeito dos plugs lacrimais?**

Os plugs permanentes, especialmente os smart plugs, podem durar anos com excelente retenção. Estudos mostram que plugs de silicone convencionais têm taxa de retenção de 84,2% após três meses, 69,5% após um ano e 55,8% após mediana de dois anos. No entanto, a extrusão espontânea ocorre em 25-50% dos casos com plugs convencionais, sendo muito menor com smart plugs termossensíveis (97,3% de retenção).[52][25][20][22][8]

**4. A Clínica Saraiva Vision atende quais planos de saúde?**

Para informações sobre planos de saúde atendidos, prazos de agendamento e valores, entre em contato diretamente pelo telefone **(33) 99860-1427**. Nossa equipe terá prazer em esclarecer todas as suas dúvidas.

**5. Posso fazer o implante de plugs lacrimais no mesmo dia da consulta?**

Geralmente, o oftalmologista realiza primeiro uma avaliação completa e exames diagnósticos para confirmar a indicação. O procedimento de inserção é simples e rápido, podendo ser realizado no consultório. Em alguns casos, o implante pode ser feito no mesmo dia, mas isso depende da avaliação médica individualizada.[17][7]

**6. Como chegar à Clínica Saraiva Vision em Caratinga?**

A Clínica Saraiva Vision está localizada em Caratinga, MG. Para informações detalhadas sobre endereço, horários de funcionamento e como chegar, entre em contato pelo telefone **(33) 99860-1427**.

**7. Os plugs lacrimais causam lacrimejamento excessivo?**

Epífora (lacrimejamento excessivo) é uma complicação possível mas não frequente, ocorrendo em aproximadamente 9-15% dos pacientes. Quando ocorre, geralmente indica que a produção lacrimal está adequada e o plug pode ser removido se necessário.[24][7]

**8. Qual a diferença entre plugs convencionais e smart plugs?**

Smart plugs são feitos de material acrílico hidrofóbico termossensível que é sólido à temperatura ambiente mas se torna gel macio à temperatura corporal. Eles se expandem e se ajustam à anatomia exata do ponto lacrimal sem necessidade de dilatação prévia, apresentando taxa de retenção significativamente superior (97,3%) comparada aos plugs de silicone convencionais.[18][21][19][20][22][8]

***

## **Conclusão**

A síndrome do olho seco é uma condição crônica que exige diagnóstico preciso e tratamento adequado para preservar o conforto e a saúde ocular. Com prevalência de 12,8% na população brasileira e chegando a 38,1% em áreas urbanas, representa um problema de saúde pública significativo que afeta milhões de pessoas.[3][4][2][1]

A **meibografia** representa um avanço significativo no diagnóstico, permitindo visualizar a estrutura das glândulas de Meibômio e identificar precocemente a disfunção glandular. Esta tecnologia é especialmente importante considerando que a disfunção das glândulas de Meibômio é responsável por aproximadamente 86% dos casos de olho seco, e o olho seco evaporativo representa até 85% de todos os casos.[14][5][6]

Já os **plugs lacrimais** oferecem uma solução eficaz e duradoura para pacientes com deficiência aquosa, com evidências científicas robustas demonstrando melhora ≥50% nos sintomas, aumento significativo no tempo de ruptura do filme lacrimal (TBUT) de 1,8 segundos, melhora no teste de Schirmer de 3,1 mm, e redução da dependência de colírios em mais de 55% dos pacientes. A taxa de retenção geral de 86%, chegando a impressionantes 97,3% com smart plugs termossensíveis, torna este tratamento uma opção atraente e eficaz.[20][22][8][7]

Na **Clínica Saraiva Vision**, em Caratinga (MG), o **Dr. Philipe Saraiva Cruz (CRM-MG 69.870)** e sua equipe estão prontos para oferecer o melhor em diagnóstico e tratamento de olho seco, com tecnologia de ponta e atendimento humanizado baseado nas melhores evidências científicas disponíveis.

**Pronto para cuidar melhor da sua visão? Agende sua consulta: (33) 99860-1427.**

***

## **Referências Bibliográficas**

1. Phelcom Technologies. Meibografia: auxílio valioso no diagnóstico de olho seco. Disponível em: https://phelcom.com/pt-br/blog/inovacao/meibografia-para-diagnostico-de-olho-seco/
2. Oftalmologia Pereira Gomes. Plug lacrimal para o tratamento do olho seco. Disponível em: https://oftalmologiapereiragomes.com.br/plug-lacrimal-para-o-tratamento-do-olho-seco/
3. Silverio J, Ferreira PDV, Paulino LV, Neto VV, Rehder JRCL. Implante de plug lacrimal termosensível para tratamento da síndrome da disfunção lacrimal. Rev Bras Oftalmol. 2010;69(4):217-21. Disponível em: https://www.scielo.br/j/rbof/a/MwGmVx55FRBh7CBPZQNZRBn/
4. Sociedade Brasileira de Oftalmologia (SBO). Disfunção das glândulas de Meibomius. Disponível em: https://sbop.com.br/paciente/doenca/disfuncao-das-glandulas-de-meibomius/
5. Midori Clínica Oftalmológica. Como o plug lacrimal pode aliviar sintomas de olho seco. Disponível em: https://www.midori.med.br/notas/plug-lacrimal-olho-seco
`

const author = {
  name: 'Dr. Philipe Saraiva Cruz',
  role: 'Oftalmologista Responsável',
  credentials: 'CRM-MG 69.870',
}

const ctaPhone = '(33) 99860-1427'

const uploadCoverImage = async (existing?: ExistingArticle) => {
  if (existing?.coverImage?.sourceUrl === coverImageUrl && existing.coverImage.asset?._ref) {
    return existing.coverImage.asset._ref
  }

  const response = await fetch(coverImageUrl)

  if (!response.ok) {
    throw new Error(`Failed to download cover image: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {filename: 'meibografia-plugs-lacrimais.jpg'})
  return asset._id
}

const main = async () => {
  const existing = await client.fetch<ExistingArticle | null>("*[_id == $id][0]", {id: articleId})
  const coverAssetId = await uploadCoverImage(existing ?? undefined)
  const publishedAt = existing?.publishedAt ?? new Date().toISOString()

  const document = {
    _id: articleId,
    _type: 'article',
    title: metaTitle,
    slug: {current: slug},
    excerpt,
    metaTitle,
    metaDescription,
    keywords,
    coverImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: coverAssetId,
      },
      alt: coverImageAlt,
      sourceUrl: coverImageUrl,
      caption: coverImageCaption,
    },
    publishedAt,
    contentFormat: 'markdown',
    content,
    references,
    author,
    ctaPhone,
  }

  await client.createOrReplace(document)
  console.log(`Artigo publicado com sucesso: ${articleId}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
