# JSON-LD Schema Markup - FAQs Saraiva Vision
**Autor:** Dr. Philipe Saraiva Cruz  
**Data:** 27 de Outubro de 2025

## 📌 INSTRUÇÕES DE USO

Cada schema deve ser inserido na tag `<head>` ou no final do `<body>` da página correspondente. O Google indexará automaticamente as FAQs e poderá exibi-las como Rich Results nos resultados de busca.

**Validação obrigatória:** https://search.google.com/test/rich-results

---

## 🏥 HOMEPAGE - SCHEMA

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quem é o Dr. Philipe Saraiva Cruz?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O Dr. Philipe Saraiva Cruz é médico oftalmologista com especialização em cirurgia de catarata, glaucoma e córnea. Com mais de [X anos] de experiência, atende na Saraiva Vision Clínica Oftalmológica, oferecendo diagnóstico preciso e tratamentos modernos para diversas condições oculares."
      }
    },
    {
      "@type": "Question",
      "name": "Onde fica a Saraiva Vision e como agendar consulta?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Saraiva Vision está localizada em [endereço completo]. Você pode agendar sua consulta pelos telefones (XX) XXXX-XXXX ou WhatsApp (XX) XXXXX-XXXX. Também é possível agendar online através do nosso site."
      }
    },
    {
      "@type": "Question",
      "name": "A clínica atende por convênio ou particular?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Saraiva Vision atende tanto pacientes particulares quanto por convênios médicos. Entre os convênios aceitos estão [listar principais]. Para confirmar se seu plano é aceito, entre em contato com nossa equipe."
      }
    },
    {
      "@type": "Question",
      "name": "Quais exames oftalmológicos são realizados na clínica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Realizamos exames completos incluindo: mapeamento de retina, tonometria (pressão ocular), biomicroscopia, teste de acuidade visual, refração computadorizada, paquimetria, topografia de córnea, OCT (tomografia de coerência óptica) e campimetria visual."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo demora uma consulta oftalmológica completa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Uma consulta oftalmológica completa dura entre 45 minutos e 1 hora, incluindo anamnese, exames preliminares, avaliação com o oftalmologista e discussão do diagnóstico. Em casos que necessitam exames complementares, pode ser necessário retorno."
      }
    },
    {
      "@type": "Question",
      "name": "A clínica realiza cirurgias oftalmológicas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, realizamos cirurgias de catarata com implante de lentes intraoculares, cirurgias para glaucoma, pterígio e outras condições. As cirurgias são realizadas em centro cirúrgico equipado com tecnologia moderna e seguem protocolos rigorosos de segurança."
      }
    },
    {
      "@type": "Question",
      "name": "Crianças podem ser atendidas na Saraiva Vision?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, atendemos pacientes de todas as idades, incluindo crianças. O acompanhamento oftalmológico infantil é fundamental para detectar problemas como miopia, astigmatismo, estrabismo e ambliopia (olho preguiçoso) precocemente."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a diferença entre oftalmologista e optometrista?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O oftalmologista é médico especializado em saúde ocular, podendo diagnosticar doenças, prescrever medicamentos e realizar cirurgias. O optometrista é profissional da saúde que realiza exames de visão e adapta óculos e lentes de contato, mas não realiza cirurgias."
      }
    },
    {
      "@type": "Question",
      "name": "Como sei se preciso trocar o grau dos óculos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sinais de que você precisa atualizar o grau incluem: visão embaçada, dores de cabeça frequentes (especialmente ao ler), dificuldade para enxergar à noite, necessidade de apertar os olhos para ver melhor e fadiga ocular. O ideal é fazer avaliação anual."
      }
    },
    {
      "@type": "Question",
      "name": "A clínica oferece atendimento de urgência oftalmológica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Orientamos que urgências oftalmológicas como traumas oculares, perda súbita de visão, dor intensa nos olhos ou presença de corpo estranho sejam avaliadas imediatamente. Entre em contato para verificar disponibilidade de atendimento urgente."
      }
    }
  ]
}
```

---

## 👁️ CATARATA - SCHEMA

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é catarata e quais são os sintomas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A catarata é a opacificação do cristalino, a lente natural do olho que fica atrás da íris. Os principais sintomas incluem: visão embaçada ou nublada, dificuldade para dirigir à noite (halos ao redor das luzes), cores desbotadas ou amareladas, sensibilidade aumentada à luz, visão dupla em um olho e necessidade frequente de trocar o grau dos óculos."
      }
    },
    {
      "@type": "Question",
      "name": "Catarata tem cura? Como é o tratamento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, a catarata tem cura definitiva através de cirurgia. Não existe tratamento com colírios ou medicamentos que elimine a catarata. A cirurgia consiste na remoção do cristalino opaco e implante de uma lente intraocular artificial. O procedimento é rápido (cerca de 15-20 minutos), realizado com anestesia local e tem alta taxa de sucesso."
      }
    },
    {
      "@type": "Question",
      "name": "Com que idade a catarata aparece?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A catarata senil (relacionada à idade) geralmente surge após os 60 anos, mas pode aparecer mais cedo. Existem também cataratas congênitas (presentes desde o nascimento), traumáticas (após acidentes) e secundárias (causadas por diabetes, uso prolongado de corticoides ou outras doenças)."
      }
    },
    {
      "@type": "Question",
      "name": "A cirurgia de catarata dói? Como é a recuperação?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A cirurgia é indolor, realizada com anestesia local (colírio anestésico). Você pode sentir leve pressão durante o procedimento, mas sem dor. A recuperação é rápida: a visão melhora progressivamente nas primeiras 24-48 horas. É normal sentir leve desconforto ou arranhão nos primeiros dias. A recuperação completa ocorre em 4-6 semanas."
      }
    },
    {
      "@type": "Question",
      "name": "Quais tipos de lentes intraoculares existem?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Existem diversos tipos de lentes intraoculares: Monofocais (corrigem visão para longe, necessitará óculos para perto), Multifocais/Trifocais (corrigem visão para longe, intermediário e perto), Tóricas (corrigem astigmatismo) e EDOF foco estendido (oferecem boa visão em várias distâncias)."
      }
    },
    {
      "@type": "Question",
      "name": "Posso operar os dois olhos no mesmo dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Geralmente, recomenda-se operar um olho de cada vez, com intervalo de 1-2 semanas entre as cirurgias. Isso permite avaliar a recuperação do primeiro olho e ajustar, se necessário, a programação da lente do segundo olho. Em casos específicos, pode-se considerar cirurgia bilateral simultânea."
      }
    },
    {
      "@type": "Question",
      "name": "Catarata pode voltar após a cirurgia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A catarata propriamente não volta, pois o cristalino natural foi removido. Porém, em 20-40% dos casos, pode ocorrer opacificação da cápsula posterior (membrana que sustenta a lente), chamada catarata secundária. O tratamento é simples e rápido: aplicação de laser YAG (procedimento ambulatorial de 5 minutos, indolor)."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto custa a cirurgia de catarata?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O valor varia conforme o tipo de lente intraocular escolhida. Lentes monofocais são mais acessíveis, enquanto lentes premium (multifocais, tóricas) têm custo maior. A cirurgia é coberta por convênios (lente monofocal), mas lentes premium geralmente requerem complementação."
      }
    },
    {
      "@type": "Question",
      "name": "Quem tem diabetes pode fazer cirurgia de catarata?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, diabéticos podem fazer cirurgia de catarata, mas é fundamental que a glicemia esteja controlada. Diabetes descompensado aumenta risco de complicações e retarda a cicatrização. Realizamos avaliação criteriosa do fundo de olho para verificar retinopatia diabética antes do procedimento."
      }
    },
    {
      "@type": "Question",
      "name": "Quais cuidados devo ter após a cirurgia de catarata?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Os principais cuidados pós-operatórios incluem: usar os colírios prescritos nos horários corretos, evitar coçar ou apertar os olhos, não dormir sobre o olho operado nas primeiras semanas, evitar esforço físico intenso e natação por 30 dias, usar óculos escuros ao sair de casa, não usar maquiagem nos olhos por 15 dias e comparecer às consultas de retorno."
      }
    }
  ]
}
```

---

## 🟢 GLAUCOMA - SCHEMA

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é glaucoma e por que é perigoso?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Glaucoma é uma doença que danifica o nervo óptico, geralmente causada por pressão ocular elevada. É a principal causa de cegueira irreversível no mundo. O perigo está no fato de ser silencioso: a perda de visão periférica ocorre gradualmente, sem sintomas, até estágios avançados. Por isso, é chamado de ladrão silencioso da visão."
      }
    },
    {
      "@type": "Question",
      "name": "Quais são os sintomas do glaucoma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Na maioria dos casos (glaucoma de ângulo aberto), não há sintomas até perda visual significativa. No glaucoma agudo de ângulo fechado, os sintomas são súbitos e graves: dor ocular intensa, dor de cabeça severa, náusea e vômito, visão embaçada, halos coloridos ao redor das luzes e olho vermelho. Esse quadro é emergência médica."
      }
    },
    {
      "@type": "Question",
      "name": "Qual é a pressão ocular normal e como medir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A pressão intraocular normal varia entre 10-21 mmHg. Medimos através da tonometria, exame rápido e indolor realizado durante a consulta. Importante: glaucoma pode ocorrer mesmo com pressão normal (glaucoma de pressão normal), por isso avaliamos também o nervo óptico e campo visual."
      }
    },
    {
      "@type": "Question",
      "name": "Glaucoma tem cura? Como é o tratamento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Glaucoma não tem cura, mas pode ser controlado efetivamente, preservando a visão. O tratamento visa reduzir a pressão ocular e inclui: colírios hipotensores (primeira linha), laser trabeculoplastia (SLT) e cirurgia (trabeculectomia, implantes de drenagem). O tratamento é individualizado conforme tipo e gravidade do glaucoma."
      }
    },
    {
      "@type": "Question",
      "name": "Tenho que usar colírio para glaucoma a vida toda?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Na maioria dos casos, sim. O glaucoma é uma condição crônica que requer controle contínuo da pressão ocular. Interromper o tratamento pode levar à progressão da doença e perda visual irreversível. Alguns pacientes conseguem controle com laser ou cirurgia, reduzindo ou eliminando colírios."
      }
    },
    {
      "@type": "Question",
      "name": "Glaucoma é hereditário? Devo fazer exames?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, histórico familiar aumenta o risco em 4-9 vezes. Se você tem parentes de primeiro grau (pais, irmãos) com glaucoma, deve fazer exames preventivos anualmente a partir dos 40 anos (ou antes, se houver outros fatores de risco). O diagnóstico precoce é fundamental para preservar a visão."
      }
    },
    {
      "@type": "Question",
      "name": "Quais exames detectam glaucoma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O diagnóstico de glaucoma requer avaliação completa: tonometria (medida da pressão ocular), fundoscopia (avaliação do nervo óptico), campimetria visual (teste do campo de visão), OCT de nervo óptico (análise das fibras nervosas) e paquimetria (espessura da córnea que influencia leitura da pressão)."
      }
    },
    {
      "@type": "Question",
      "name": "Posso ficar cego por causa do glaucoma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Se não tratado, o glaucoma pode levar à cegueira irreversível. Porém, com diagnóstico precoce e tratamento adequado, a grande maioria dos pacientes mantém visão funcional por toda a vida. O segredo é detecção precoce e adesão rigorosa ao tratamento."
      }
    },
    {
      "@type": "Question",
      "name": "Glaucoma e catarata são a mesma coisa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. São doenças diferentes: Catarata é opacificação do cristalino (lente do olho), tratada com cirurgia, visão é restaurada. Glaucoma é dano ao nervo óptico, tratamento controla mas não recupera visão perdida. Uma pessoa pode ter ambas as condições simultaneamente."
      }
    },
    {
      "@type": "Question",
      "name": "Estresse e pressão alta causam glaucoma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pressão arterial alta não causa glaucoma diretamente, mas pode influenciar a pressão ocular e fluxo sanguíneo no nervo óptico. Estresse emocional isoladamente não causa glaucoma, mas pode elevar temporariamente a pressão ocular. O principal fator de risco é a pressão intraocular elevada, idade, histórico familiar e etnia."
      }
    }
  ]
}
```

---

## 👓 LENTES DE CONTATO - SCHEMA

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qual a diferença entre lentes de contato gelatinosas e rígidas?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As lentes gelatinosas (hidrogel ou silicone-hidrogel) são macias, confortáveis e adaptam-se rapidamente. Indicadas para a maioria dos usuários. As lentes rígidas gás-permeáveis (RGP) são mais duráveis, oferecem visão mais nítida e permitem melhor oxigenação da córnea, mas requerem período de adaptação. Usadas em casos de ceratocone, astigmatismo alto ou córneas irregulares."
      }
    },
    {
      "@type": "Question",
      "name": "Posso dormir com lentes de contato?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não é recomendado dormir com lentes de contato, exceto lentes aprovadas especificamente para uso contínuo (overnight). Dormir com lentes comuns aumenta drasticamente o risco de infecções graves como ceratite, pois reduz a oxigenação da córnea."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo posso usar lentes de contato por dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O tempo máximo recomendado é 8-10 horas por dia para lentes descartáveis diárias, e até 12-14 horas para lentes mensais de alta permeabilidade ao oxigênio. Exceder esse tempo pode causar hipóxia corneana (falta de oxigênio), olhos vermelhos, desconforto e aumentar risco de infecções."
      }
    },
    {
      "@type": "Question",
      "name": "Lentes de contato coloridas fazem mal?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lentes coloridas são seguras quando adquiridas com prescrição médica e de fabricantes confiáveis. O risco está em lentes vendidas sem orientação médica (em lojas de fantasia, internet), que podem não ter aprovação sanitária, causar alergias, arranhões na córnea e infecções graves. Sempre consulte um oftalmologista antes de usar lentes coloridas."
      }
    },
    {
      "@type": "Question",
      "name": "Como limpar e armazenar lentes de contato corretamente?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Siga estas etapas: 1) Lave as mãos com sabão neutro antes de manusear, 2) Friccione a lente com solução multipropósito na palma da mão (ambos os lados), 3) Enxágue com solução nova (nunca água da torneira), 4) Armazene em estojo limpo com solução nova, 5) Troque a solução diariamente (nunca reaproveite), 6) Substitua o estojo a cada 3 meses."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a validade das lentes de contato? Posso usar além do prazo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "As lentes têm validades específicas: Diárias (usar e descartar no mesmo dia), Quinzenais (15 dias de uso), Mensais (30 dias de uso). Nunca use lentes além do prazo recomendado, mesmo que pareçam em bom estado. Com o tempo, acumulam-se depósitos de proteínas e microorganismos que aumentam risco de infecções graves e reações alérgicas."
      }
    },
    {
      "@type": "Question",
      "name": "Posso usar lentes de contato na praia ou piscina?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não é recomendado. Água (piscina, mar, lago, chuveiro) pode conter microorganismos como Acanthamoeba, que causam infecções graves e difíceis de tratar. Se precisar usar lentes em ambiente aquático, use óculos de natação vedados e descarte as lentes imediatamente após. Idealmente, use óculos de grau para natação ou lentes diárias descartáveis."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto custam lentes de contato? É mais caro que óculos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O custo varia: Lentes diárias R$ 80-200/caixa (45 lentes), Lentes mensais R$ 60-150/caixa (3-6 lentes), Lentes para astigmatismo 20-40% mais caras. Adicione solução multipropósito e estojo. A longo prazo, óculos podem ser mais econômicos, mas lentes oferecem liberdade e conforto em atividades esportivas."
      }
    },
    {
      "@type": "Question",
      "name": "Qualquer pessoa pode usar lentes de contato?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A maioria das pessoas pode usar, mas existem contraindicações: olho seco grave, infecções oculares ativas, alergias oculares severas, impossibilidade de higienizar adequadamente e ambientes muito empoeirados/poluídos. A adaptação requer avaliação oftalmológica completa, incluindo medição da curvatura da córnea e teste de produção lacrimal."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a diferença entre lentes de contato comuns e para astigmatismo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lentes para astigmatismo (chamadas tóricas) têm formato especial para corrigir a curvatura irregular da córnea característica do astigmatismo. Elas possuem estabilização para se manterem na posição correta no olho. São um pouco mais espessas e geralmente mais caras que lentes esféricas comuns."
      }
    }
  ]
}
```

---

## 🩺 CONSULTA OFTALMOLÓGICA - SCHEMA

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Com que frequência devo ir ao oftalmologista?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A frequência varia: Crianças (primeira consulta aos 6 meses, depois aos 3 anos e anualmente), Adultos 18-40 anos sem problemas (a cada 2 anos), Adultos 40-64 anos (anualmente - risco de presbiopia e glaucoma), Acima de 65 anos (anualmente - risco de catarata e degeneração macular), Usuários de lentes (anualmente), Diabéticos e hipertensos (anualmente ou conforme orientação)."
      }
    },
    {
      "@type": "Question",
      "name": "O que é exame de fundo de olho e por que dilatar a pupila?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O exame de fundo de olho (fundoscopia ou mapeamento de retina) permite avaliar retina, nervo óptico e vasos sanguíneos. A dilatação da pupila com colírio é necessária para visualizar toda a periferia da retina, detectando problemas como descolamento de retina, retinopatia diabética, degeneração macular e glaucoma. Após dilatação, a visão fica borrada por 3-6 horas."
      }
    },
    {
      "@type": "Question",
      "name": "Posso dirigir após consulta oftalmológica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Depende dos exames. Se houver dilatação da pupila, você ficará com visão embaçada e sensibilidade à luz por algumas horas, dificultando a direção. Recomendamos vir acompanhado ou usar transporte alternativo. Se a consulta for apenas refração (teste de grau) sem dilatação, pode dirigir normalmente."
      }
    },
    {
      "@type": "Question",
      "name": "Preciso de pedido médico para consultar oftalmologista?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não, você pode consultar diretamente o oftalmologista sem encaminhamento. Oftalmologia é especialidade de acesso direto. Porém, se for usar convênio, verifique se seu plano exige pedido médico para consultas eletivas. Consultas de urgência geralmente não precisam."
      }
    },
    {
      "@type": "Question",
      "name": "O que levar na primeira consulta oftalmológica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Traga: documento de identidade, carteirinha do convênio (se aplicável), receita atual de óculos ou lentes, lista de medicamentos em uso, exames oftalmológicos anteriores, histórico de cirurgias oculares e informações sobre doenças sistêmicas (diabetes, hipertensão)."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo demora para ficar pronta a receita de óculos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A receita de óculos é entregue imediatamente ao final da consulta. O exame de refração (medição do grau) leva cerca de 15-20 minutos. Se houver necessidade de dilatação da pupila para exame mais detalhado, a consulta pode se estender, mas a receita ainda é fornecida no mesmo dia."
      }
    },
    {
      "@type": "Question",
      "name": "Posso usar a receita de óculos para comprar lentes de contato?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não diretamente. Embora os graus sejam relacionados, lentes de contato requerem prescrição específica que inclui: curvatura base da lente, diâmetro da lente, marca e modelo específicos e grau ajustado (lentes ficam mais próximas ao olho que óculos). É necessária consulta com adaptação de lentes."
      }
    },
    {
      "@type": "Question",
      "name": "Oftalmologista pode prescrever remédios e atestar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, oftalmologista é médico com formação completa, podendo prescrever qualquer medicamento e fornecer atestados médicos. Além das doenças oculares, pode receitar medicamentos sistêmicos relacionados (anti-inflamatórios, antibióticos, analgésicos)."
      }
    },
    {
      "@type": "Question",
      "name": "Quais doenças o oftalmologista detecta além de problemas de visão?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O exame oftalmológico pode revelar: Diabetes (retinopatia diabética), Hipertensão arterial (alterações nos vasos da retina), Colesterol alto (depósitos na córnea e retina), Doenças autoimunes (uveítes, esclerites), Doenças neurológicas (edema de papila, paralisias oculares) e Câncer (melanoma de coróide, metástases)."
      }
    },
    {
      "@type": "Question",
      "name": "Convênio cobre todos os exames oftalmológicos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Os convênios geralmente cobrem consultas e exames básicos (refração, tonometria, biomicroscopia, fundo de olho). Exames complementares como OCT, campimetria, topografia de córnea e angiografia podem ter cobertura limitada ou exigir autorização prévia. Verifique com seu plano ou consulte nossa equipe."
      }
    }
  ]
}
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Como adicionar no Next.js:

#### Opção 1: Componente de Schema (Recomendado)

Crie `/src/components/SEO/FAQSchema.tsx`:

```typescript
import { type FC } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQItem[]
}

export const FAQSchema: FC<FAQSchemaProps> = ({ faqs }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

#### Opção 2: No Metadata (Next.js 13+ App Router)

```typescript
export const metadata: Metadata = {
  title: 'Cirurgia de Catarata | Saraiva Vision',
  description: 'Cirurgia de catarata com tecnologia moderna...',
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        // ... FAQs aqui
      ],
    }),
  },
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de publicar:

- [ ] Validar cada schema no Google Rich Results Test
- [ ] Verificar sintaxe JSON (sem erros)
- [ ] Testar em mobile e desktop
- [ ] Confirmar que todas as URLs internas funcionam
- [ ] Revisar ortografia e gramática
- [ ] Verificar Flesch Reading Ease Score >60
- [ ] Testar tempo de carregamento da página
- [ ] Verificar que schema está no `<head>` ou final do `<body>`
- [ ] Submeter sitemap atualizado no Google Search Console
- [ ] Monitorar indexação nos próximos 7-14 dias

### Links úteis:

- **Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Validator:** https://validator.schema.org/
- **JSON Validator:** https://jsonlint.com/

---

**Próximo documento:** Componente React Accordion

