/**
 * Conteúdo e lógica — Mapa do Ciclo Amoroso
 * Padrões: A alerta | B autoabandono | C indisponível | D distância
 */
window.MAPA_DATA = {
  product: {
    name: "Mapa do Ciclo Amoroso",
    fullName: "Mapa Completo do Ciclo Amoroso",
  },

  open: {
    A: {
      title: "Por que relações que começam tão intensas acabam deixando tanta confusão?",
      subtitle: "Alguns relacionamentos mudam de rosto, mas repetem o mesmo roteiro.",
    },
    B: {
      title: "Você sente que cada relação é diferente… até o final ser quase o mesmo?",
      subtitle: "Às vezes o que muda é o rosto — o ciclo emocional se repete.",
    },
    support: [
      "Qual ciclo afetivo pode estar influenciando suas escolhas",
      "O que costuma ativar suas reações",
      "Quais sinais você tende a justificar",
      "Qual pode ser o primeiro passo para interromper essa repetição",
    ],
    bullets: ["Aproximadamente 3 minutos", "Respostas confidenciais", "Resultado personalizado"],
    cta: "DESCOBRIR MEU CICLO",
  },

  questions: [
    {
      id: "q1",
      text: "Qual situação mais se repetiu nas suas relações?",
      options: [
        { key: "A", label: "A pessoa demonstrou muito interesse no começo e depois se afastou." },
        { key: "B", label: "Eu me esforcei muito mais para fazer a relação funcionar." },
        { key: "C", label: "Eu me envolvi com alguém que nunca estava totalmente disponível." },
        { key: "D", label: "Quando a relação começou a ficar séria, senti vontade de me afastar." },
      ],
    },
    {
      id: "q2",
      text: "Quando o comportamento de alguém muda, o que costuma acontecer?",
      options: [
        { key: "A", label: "Começo a analisar mensagens, respostas e pequenos sinais." },
        { key: "B", label: "Tento descobrir o que posso fazer para recuperar a conexão." },
        { key: "C", label: "Sinto ainda mais vontade de conquistar a pessoa." },
        { key: "D", label: "Também me afasto e finjo que não estou sentindo nada." },
      ],
    },
    {
      id: "q3",
      text: "O que mais costuma prender você a uma relação confusa?",
      options: [
        { key: "A", label: "A esperança de que tudo volte a ser como era no início." },
        { key: "B", label: "A sensação de que a pessoa precisa da minha ajuda." },
        { key: "C", label: "A química e a intensidade que sinto quando estamos bem." },
        { key: "D", label: "O medo de me abrir novamente com outra pessoa." },
      ],
    },
    {
      id: "q4",
      text: "Quando percebe um sinal que incomoda, você geralmente…",
      options: [
        { key: "A", label: "Tenta acreditar que não é nada para não perder a pessoa." },
        { key: "B", label: "Pensa que, com paciência e apoio, a pessoa pode mudar." },
        { key: "C", label: "Interpreta a dificuldade como parte da atração." },
        { key: "D", label: "Evita conversar porque não quer depender emocionalmente de ninguém." },
      ],
    },
    {
      id: "q5",
      text: "Em uma discussão, qual reação mais combina com você?",
      options: [
        { key: "A", label: "Preciso resolver rapidamente para sentir que está tudo bem." },
        { key: "B", label: "Assumo a responsabilidade e tento recuperar a harmonia." },
        { key: "C", label: "Fico tentando entender por que a pessoa mudou." },
        { key: "D", label: "Preciso me afastar e demoro para voltar a falar." },
      ],
    },
    {
      id: "q6",
      text: "Qual receio pesa mais nas suas relações?",
      options: [
        { key: "A", label: "Ser deixada depois de me apegar." },
        { key: "B", label: "Não ser importante ou necessária para a pessoa." },
        { key: "C", label: "Descobrir que interpretei como conexão algo que não era recíproco." },
        { key: "D", label: "Perder minha liberdade ou me sentir emocionalmente invadida." },
      ],
    },
    {
      id: "q7",
      text: "Depois que uma relação termina ou esfria, o que mais acontece?",
      options: [
        { key: "A", label: "Releio conversas e tento descobrir onde errei." },
        { key: "B", label: "Penso em tudo que poderia ter feito para salvar a relação." },
        { key: "C", label: "Continuo esperando uma reaproximação ou mudança da pessoa." },
        { key: "D", label: "Tento desligar completamente e evito pensar no que senti." },
      ],
    },
    {
      id: "q8",
      text: "Qual mudança seria mais importante para você?",
      options: [
        { key: "A", label: "Deixar de viver com medo de perder alguém." },
        { key: "B", label: "Parar de carregar a relação nas costas." },
        { key: "C", label: "Parar de confundir indisponibilidade com conexão." },
        { key: "D", label: "Conseguir me envolver sem sentir vontade de fugir." },
      ],
    },
    {
      id: "q9",
      text: "O que seria mais valioso neste momento?",
      options: [
        { key: "A", label: "Reconhecer meus gatilhos antes de reagir." },
        { key: "B", label: "Aprender a colocar limites sem culpa." },
        { key: "C", label: "Identificar mais cedo quando alguém não está disponível." },
        { key: "D", label: "Demonstrar o que sinto com mais segurança." },
      ],
    },
  ],

  mid: {
    title: "Identificamos uma repetição importante",
    lines: [
      "Não parece ser apenas falta de sorte.",
      "Suas respostas indicam que existe um gatilho recorrente influenciando:",
    ],
    bullets: [
      "Quem chama sua atenção",
      "Como você reage à distância",
      "Quais sinais tenta justificar",
      "Quanto tempo permanece em situações confusas",
    ],
    footer: "Faltam apenas três respostas para revelar seu ciclo predominante.",
    cta: "CONTINUAR MINHA ANÁLISE",
  },

  nameGate: {
    title: "Suas primeiras respostas já apontam para uma maneira específica de buscar segurança emocional.",
    ask: "Como prefere ser chamada?",
    help: "Usaremos seu primeiro nome apenas para personalizar o resultado.",
    cta: "CONTINUAR MINHA ANÁLISE",
  },

  processing: [
    "Organizando suas respostas…",
    "Analisando seus gatilhos…",
    "Comparando escolhas e reações…",
    "Identificando seu ciclo predominante…",
    "Preparando seu resultado…",
  ],

  dimensions: [
    "Escolha e atração",
    "Resposta à distância",
    "Limites e reciprocidade",
    "Proteção emocional",
  ],

  patterns: {
    A: {
      id: "A",
      name: "Alerta de Abandono",
      title: "Seu ciclo predominante é: Alerta de Abandono",
      description:
        "Quando percebe uma mudança na proximidade, seu sistema emocional entra em alerta. Pequenas alterações no comportamento da outra pessoa podem gerar uma necessidade urgente de entender o que aconteceu ou recuperar a conexão.",
      starts:
        "Uma aproximação intensa cria uma sensação de segurança. Quando a intensidade diminui, surge o receio de que a conexão esteja desaparecendo.",
      reactions: [
        "Analisar mensagens e respostas",
        "Procurar sinais de afastamento",
        "Tentar resolver tudo rapidamente",
        "Assumir que fez algo errado",
      ],
      blind:
        "O esforço para não perder a relação pode tirar sua atenção de uma pergunta importante: essa relação também está oferecendo a segurança e a reciprocidade de que você precisa?",
      exerciseTitle: "Primeiro exercício",
      exercise:
        "Antes de agir diante de um afastamento, anote: (1) o que realmente aconteceu; (2) o que você está imaginando; (3) o que uma atitude de autorrespeito faria agora.",
      dims: { choice: 72, distance: 88, limits: 55, protection: 60 },
    },
    B: {
      id: "B",
      name: "Autoabandono Afetivo",
      title: "Seu ciclo predominante é: Autoabandono Afetivo",
      description:
        "Você pode assumir mais responsabilidade pela relação do que realmente pertence a você. Para preservar o vínculo, suas necessidades acabam ficando em segundo plano.",
      starts:
        "Você percebe as dificuldades da outra pessoa e sente vontade de ajudar, compreender ou oferecer mais uma chance.",
      reactions: [
        "Fazer esforço adicional",
        "Justificar comportamentos",
        "Evitar limites para não gerar conflito",
        "Sentir culpa ao priorizar suas necessidades",
      ],
      blind: "Cuidar de alguém não precisa significar abandonar a si mesma.",
      exerciseTitle: "Primeiro exercício",
      exercise:
        'Escolha uma necessidade que costuma silenciar e complete: "Para continuar nesta relação com respeito por mim, eu preciso de…"',
      dims: { choice: 65, distance: 58, limits: 85, protection: 52 },
    },
    C: {
      id: "C",
      name: "Atração pelo Indisponível",
      title: "Seu ciclo predominante é: Atração pelo Indisponível",
      description:
        "A incerteza pode aumentar sua sensação de interesse e intensidade. Quanto menos clara é a posição da outra pessoa, mais energia você pode investir tentando compreender ou conquistar.",
      starts:
        "A pessoa oferece conexão suficiente para gerar esperança, mas não estabilidade suficiente para produzir segurança.",
      reactions: [
        "Esperar que a intensidade volte",
        "Interpretar sinais pequenos como grandes avanços",
        "Permanecer presa ao potencial da relação",
        "Confundir imprevisibilidade com química",
      ],
      blind: "Uma relação pode ser intensa sem ser recíproca.",
      exerciseTitle: "Primeiro exercício",
      exercise:
        "Liste três atitudes concretas que demonstrariam disponibilidade emocional. Depois compare a lista com o comportamento real da pessoa, não com as promessas.",
      dims: { choice: 90, distance: 70, limits: 48, protection: 55 },
    },
    D: {
      id: "D",
      name: "Proteção pela Distância",
      title: "Seu ciclo predominante é: Proteção pela Distância",
      description:
        "Quando a conexão exige mais vulnerabilidade, você pode sentir necessidade de recuperar espaço e controle. O afastamento funciona como uma forma de proteção.",
      starts:
        "A relação parece confortável enquanto existe liberdade emocional. Quando surgem expectativas, conversas profundas ou maior proximidade, aparece o impulso de recuar.",
      reactions: [
        "Evitar conversas difíceis",
        "Minimizar o que sente",
        "Demorar para responder",
        "Encontrar razões para se desligar",
      ],
      blind: "Proteger sua liberdade não precisa significar impedir toda forma de intimidade.",
      exerciseTitle: "Primeiro exercício",
      exercise:
        'Escolha algo pequeno que você sente, mas normalmente evitaria dizer. Expresse sem cobrança, usando: "Quando isso acontece, eu percebo que sinto…"',
      dims: { choice: 50, distance: 62, limits: 70, protection: 92 },
    },
  },

  offer: {
    bridge:
      "Você já identificou o ciclo. Agora descubra como ele funciona especificamente em você.",
    title: "Desbloqueie seu Mapa Completo do Ciclo Amoroso",
    body:
      "O resultado gratuito mostrou qual repetição aparece com mais força. O mapa completo mostra onde ela começa, como se mantém e quais atitudes podem ajudar você a responder de uma maneira diferente.",
    features: [
      "Ciclo predominante e padrão secundário",
      "Gráfico das quatro dimensões",
      "Gatilhos emocionais e comportamentos automáticos",
      "Sinais que você tende a minimizar",
      "Crenças que sustentam a repetição",
      "Como diferenciar conexão de ansiedade",
      "Limites para relações confusas",
      "Critérios para relações mais seguras",
      "Plano de proteção emocional de 28 dias",
    ],
    cta: "QUERO ACESSAR MEU MAPA COMPLETO",
    disclaimer:
      "Material educativo de autoconhecimento. Não realiza diagnóstico psicológico e não substitui acompanhamento profissional.",
    bonuses: {
      title: "E ainda leva 3 bônus exclusivos",
      subtitle:
        "Junto com o Mapa Completo, você recebe três cartilhas práticas para usar nos dias em que a confusão ou o impulso voltam.",
      totalLabel: "Valor percebido dos bônus",
      totalValue: "R$ 111",
      note: "Inclusos sem custo adicional na sua compra. Valores de referência do que você recebe — não são preços anteriores de venda avulsa.",
      items: [
        {
          num: "01",
          name: "Ritual de Limpeza e Renovação Emocional",
          alt: "Banho de Renovação Amorosa",
          desc: "Guia de 15 minutos com banho aromático (ou alternativa), respiração, escrita de encerramento e compromisso de recomeço.",
          value: "R$ 27",
        },
        {
          num: "02",
          name: "Ritual de Desapego da Relação Confusa",
          alt: "Ritual de Corte da Confusão Emocional",
          desc: "Realidade × expectativa, carta que não precisa ser enviada, gatilhos, plano de 7 dias e checklist de saudade vs. possibilidade.",
          value: "R$ 37",
        },
        {
          num: "03",
          name: "Kit de Proteção Emocional para Dias de Recaída",
          alt: "Escudo de Proteção Emocional",
          desc: "Roteiros de pausa, checklist de 5 minutos, cartão de clareza, mensagens de limite e plano de emergência de 24 horas.",
          value: "R$ 47",
        },
      ],
    },
  },
};
