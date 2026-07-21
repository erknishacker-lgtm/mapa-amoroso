/**
 * Motor de padrões — base conceitual em temas comuns da psicologia
 * dos relacionamentos (apego, repetição afetiva, regulação emocional).
 * NÃO é instrumento clínico validado nem diagnóstico.
 */
window.MAPA_DATA = {
  patterns: {
    anxious: {
      id: "anxious",
      name: "Apego Ansioso no Amor",
      offerPersonal: "Com base nas suas respostas, o alarme de abandono aparece cedo demais — e isso tem um desenho.",
      offerHook:
        "Você já sabe o nome do padrão. O que ainda está bloqueado é o mapa de como o silêncio vira prova de que você “não basta” — e o protocolo exato para não decidir no desespero.",
      chapters: [
        { title: "Raio-X do seu histórico", free: true, teaser: "Já liberado no parcial" },
        { title: "Mapa dos gatilhos (o que acende o alarme)", free: false, teaser: "Demora, tom frio, incerteza…" },
        { title: "Crenças que te fazem aceitar menos", free: false, teaser: "As frases internas que prendem o ciclo" },
        { title: "Sinais que você suaviza por carência", free: false, teaser: "O checklist que o coração passa por cima" },
        { title: "Técnicas de regulação + pedido limpo", free: false, teaser: "Janela de 90 min, CBT leve, base segura" },
        { title: "Critérios para a próxima escolha", free: false, teaser: "Para não repetir o mesmo fim com outro rosto" },
      ],
      partialSummary:
        "Suas respostas indicam um ciclo em que a proximidade acalma — e a distância (mesmo pequena) acende alarme. Você tende a ler silêncio, demora ou esfriamento como ameaça ao vínculo, e reage tentando recuperar segurança rápido.",
      partialBullets: [
        "Alta sensibilidade a sinais de afastamento",
        "Impulso de buscar reasseguramento (mensagens, explicações, “consertar” o clima)",
        "Dificuldade de ficar em paz quando o outro está emocionalmente “longe”",
      ],
      mirror:
        "O que parece “amor intenso” muitas vezes é o sistema de alarme do apego ligado. A dor não é fraqueza: é um padrão aprendido de buscar segurança no outro.",
      what:
        "No apego ansioso, o sistema emocional fica hiper-atento a rejeição. Você pode se doar, explicar demais ou aceitar menos do que merece — não por “ser demais”, mas porque a solidão e a incerteza doem demais no corpo.",
      how:
        "Em várias relações, o ciclo se repete: conexão forte no início → qualquer instabilidade → ansiedade → busca de proximidade → alívio temporário → nova instabilidade. O parceiro muda; o roteiro interno permanece.",
      triggers: [
        "Demora para responder mensagens ou respostas curtas",
        "Mudança de tom, menos carinho, menos planos",
        "Comparação com outras mulheres / redes sociais",
        "Discussões sem fechamento claro (“fica no ar”)",
      ],
      beliefs: [
        "“Se eu for boa o suficiente, ele não vai embora.”",
        "“Silêncio significa que eu fiz algo errado.”",
        "“Preciso resolver agora, senão perco o vínculo.”",
        "“Estar sozinha é pior do que estar em um relacionamento instável.”",
      ],
      signals: [
        "Você se sente “melhor” só quando ele confirma o afeto",
        "Você desmarca planos com amigas para ficar disponível",
        "Você relê conversas atrás de pistas",
        "Você aceita menos clareza do que pediria a uma amiga na mesma situação",
      ],
      techniques: [
        {
          title: "Janela de 90 minutos (regulação antes da reação)",
          body: "Quando o alarme subir, combine consigo: nenhuma mensagem de cobrança por 90 minutos. Nesse tempo: água, caminhada curta, 4 respirações longas (inspire 4, segure 4, solte 6). Só depois escreva o que precisa — em uma frase clara, sem acusação.",
        },
        {
          title: "Pergunta de realidade (CBT leve)",
          body: "Anote: (1) o fato observável, (2) a história que sua mente contou, (3) 2 outras explicações possíveis. Isso separa evidência de catástrofe e reduz decisões no pânico.",
        },
        {
          title: "Pedido limpo (em vez de perseguição)",
          body: "Troque “por que você sumiu?” por: “Quando fico sem notícia, fico insegura. Preciso de previsibilidade. Podemos combinar um ritmo de conversa que funcione para os dois?” Clareza > cobrança.",
        },
        {
          title: "Base segura fora do parceiro",
          body: "Liste 3 âncoras semanais que não dependem dele (corpo, amizade, rotina espiritual/reflexão, hobby). O apego ansioso melhora quando a vida inteira não repousa em uma pessoa.",
        },
      ],
      criteria: [
        "Disponibilidade emocional consistente (não só intensidade no começo)",
        "Capacidade de conversar sobre desconforto sem sumir",
        "Respeito ao seu tempo e aos seus limites",
        "Você se sente mais calma, não mais “viciante”, ao longo das semanas",
      ],
    },

    savior: {
      id: "savior",
      name: "Padrão Salvadora / Cuidadora",
      offerPersonal: "Suas respostas mostram um amor que carrega demais — e um cansaço que você quase normalizou.",
      offerHook:
        "O parcial mostra que você se torna indispensável. O mapa completo mostra por que isso te escolhe de volta — e como sair do posto de “terapeuta não paga” sem culpa.",
      chapters: [
        { title: "Raio-X do seu histórico", free: true, teaser: "Já liberado no parcial" },
        { title: "Gatilhos do resgate", free: false, teaser: "Crise, potencial, culpa de abandonar" },
        { title: "Crenças de super-responsabilidade", free: false, teaser: "“Se eu não segurar…”" },
        { title: "Sinais de desequilíbrio na troca", free: false, teaser: "Inventário do que você dá vs recebe" },
        { title: "Técnicas de fronteira e mútuaidade", free: false, teaser: "Frases prontas + teste de 24h" },
        { title: "Critérios para parceria (não projeto)", free: false, teaser: "Quem age, não só quem precisa" },
      ],
      partialSummary:
        "Suas respostas apontam para um ciclo em que o valor no amor se confunde com “consertar”, cuidar e carregar o outro. Você se sente necessária — e, com o tempo, esgotada e pouco cuidada de volta.",
      partialBullets: [
        "Atração por quem “precisa” de você ou está em crise",
        "Dificuldade de receber cuidado sem se sentir em dívida",
        "Relacionamento vira projeto de recuperação do outro",
      ],
      mirror:
        "Salvar pode parecer amor generoso. Muitas vezes é também uma forma de garantir lugar no vínculo: “se eu for indispensável, não me abandonam”.",
      what:
        "O padrão salvadora mistura empatia real com super-responsabilidade. Você assume o peso emocional do outro e adia as próprias necessidades. Quando o outro melhora (ou não), sobra solidão dentro do casal.",
      how:
        "O início costuma ter urgência: ele está perdido, ferido, confuso. Você entra com energia, conselho e presença. O vínculo se forma na crise. Depois, a estabilidade parece “sem química” — e o ciclo busca a próxima urgência.",
      triggers: [
        "Homem “potencial” com feridas evidentes",
        "Pedidos implícitos de resgate (sumiço, recaída, drama)",
        "Culpa ao priorizar a si mesma",
        "Amigas/familiares dizendo que você “aguenta tudo”",
      ],
      beliefs: [
        "“Se eu abandonar, ele desmorona — e a culpa é minha.”",
        "“Amor de verdade é aguentar.”",
        "“Minhas necessidades podem esperar.”",
        "“Ser forte é não precisar de ninguém.”",
      ],
      signals: [
        "Você é a terapeuta não remunerada da relação",
        "Ele melhora com você e piora sozinho — e isso vira laço",
        "Você sente raiva acumulada que “não tem direito” de sentir",
        "Sexo/afeto aumentam depois de crises, não na rotina saudável",
      ],
      techniques: [
        {
          title: "Teste do “e se eu não resolvesse?”",
          body: "Antes de intervir, pergunte: isso é emergência real ou desconforto que ele pode sustentar? Espere 24h antes de oferecer solução. Observe se o vínculo só existe quando você carrega.",
        },
        {
          title: "Fronteira em uma frase",
          body: "Ensaie: “Eu me importo com você. Não posso ser responsável por organizar sua vida emocional. Estou disponível para conversar, não para carregar.” Repita sem justificar demais.",
        },
        {
          title: "Inventário de troca",
          body: "Por 7 dias, anote o que você deu e o que recebeu (tempo, escuta, planos, cuidado prático). Sem drama: só dados. Padrões de desequilíbrio ficam óbvios no papel.",
        },
        {
          title: "Critério de mútuaidade",
          body: "Para seguir com alguém: ele pede ajuda E age; ele pergunta como você está de verdade; ele aceita “não” sem punição. Sem os três, você está em projeto — não em parceria.",
        },
      ],
      criteria: [
        "Parceiro com vida emocional minimamente organizada (não só potencial)",
        "Reciprocidade sem você precisar treinar o outro o tempo todo",
        "Você pode descansar sem a relação desabar",
        "Afeto estável fora de crise",
      ],
    },

    intensity: {
      id: "intensity",
      name: "Intensidade no Lugar de Compatibilidade",
      offerPersonal: "Há um fio claro: o que te parece “amor de filme” costuma ser o ciclo de alto e baixo se reinstalando.",
      offerHook:
        "Você já nomeou o padrão. Falta o mapa de por que a calma te assusta — e as regras práticas para não trocar futuro por fogo.",
      chapters: [
        { title: "Raio-X do seu histórico", free: true, teaser: "Já liberado no parcial" },
        { title: "Gatilhos de química vs realidade", free: false, teaser: "Hot-cold, ciúme, madrugada" },
        { title: "Crenças sobre “amor de verdade”", free: false, teaser: "Se não arde, não conta?" },
        { title: "Sinais que o corpo confunde com destino", free: false, teaser: "Termômetro corpo vs valores" },
        { title: "Técnicas: 90 dias + pausa pós-pico", free: false, teaser: "Para decidir fora do high" },
        { title: "Critérios de compatibilidade real", free: false, teaser: "Desejo + respeito + previsibilidade" },
      ],
      partialSummary:
        "Suas respostas sugerem confusão entre “química forte” e vínculo saudável. O padrão busca picos (paixão, drama, reaproximação) e interpreta calma como tédio — até o ciclo doer de novo.",
      partialBullets: [
        "Início avassalador, futuro idealizado rápido",
        "Brigas e reconciliações com “química” alta",
        "Parceiros “estáveis” parecem sem graça no começo",
      ],
      mirror:
        "Intensidade ativa o sistema de recompensa. Compatibilidade ativa segurança. Se o corpo foi treinado no primeiro, o segundo parece “fraco” — até você pagar o preço do caos.",
      what:
        "Este padrão se alimenta de altos e baixos. A relação parece um filme: atração imediata, ciúme, distância, volta. O cérebro grava o alívio da reconciliação como “amor verdadeiro”, reforçando o laço com a montanha-russa.",
      how:
        "Ao longo de anos, você pode ter aprendido que amor “de verdade” arde. Parceiros previsíveis são descartados cedo. O tipo instável gera ansiedade e desejo ao mesmo tempo — e o término se repete com rostos diferentes.",
      triggers: [
        "Olhar intenso, perseguição no começo, “nunca senti isso”",
        "Indisponibilidade parcial (hot-cold)",
        "Ciúme interpretado como prova de interesse",
        "Longas conversas de madrugada e pouca vida real compatível",
      ],
      beliefs: [
        "“Se não for intenso, não é amor.”",
        "“Calma é falta de paixão.”",
        "“A gente se entende de um jeito que ninguém entende.”",
        "“O problema é o timing / o mundo / a ex — não o padrão.”",
      ],
      signals: [
        "Vocês discutem a relação mais do que constroem rotina",
        "Você se sente viciada na pessoa e vazia sem o drama",
        "Amigas notam bandeiras vermelhas que você “explica”",
        "Depois do término, a saudade é do pico — não da parceria",
      ],
      techniques: [
        {
          title: "Regra dos 90 dias de realidade",
          body: "Antes de se entregar: 90 dias observando consistência em situação comum (cansaço, dinheiro, família, limites). Intensidade no mês 1 não conta como prova. Compatibilidade aparece na repetição.",
        },
        {
          title: "Termômetro de corpo vs. valor",
          body: "Separe em duas colunas: (A) o que meu corpo sente (frio na barriga, euforia) e (B) o que meus valores pedem (respeito, clareza, reciprocidade). Só avance se B estiver forte — mesmo se A gritar.",
        },
        {
          title: "Pausa pós-pico",
          body: "Depois de briga+reconciliação ou noite intensa, não tome decisão de futuro por 48h. O cérebro em “high” de reconciliação mente sobre segurança.",
        },
        {
          title: "Exposição gradual à calma",
          body: "Pratique conexões de baixa intensidade (amizade, encontros simples) e note o desconforto sem fugir. O sistema nervoso precisa reaprender que paz não é abandono.",
        },
      ],
      criteria: [
        "Desejo + respeito + previsibilidade ao mesmo tempo",
        "Conflito sem humilhação e com reparo real",
        "Vida compartilhada possível fora do “só nós dois no mundo”",
        "Você consegue imaginar tédio ocasional sem pânico",
      ],
    },

    silence: {
      id: "silence",
      name: "Auto-silenciamento Afetivo",
      offerPersonal: "O parcial aponta um custo silencioso: você preserva o vínculo engolindo a si mesma.",
      offerHook:
        "Saber o nome ajuda. O mapa completo devolve a voz — scripts de pedido, limites com consequência e o teste de quem realmente te escuta.",
      chapters: [
        { title: "Raio-X do seu histórico", free: true, teaser: "Já liberado no parcial" },
        { title: "Gatilhos do engolir", free: false, teaser: "Medo de drama, culpa, solidão" },
        { title: "Crenças que invalidam sua dor", free: false, teaser: "“É exagero” / “não adianta”" },
        { title: "Sinais de autoabandono no dia a dia", free: false, teaser: "“Tanto faz” quando não tanto faz" },
        { title: "Técnicas de micro-assertividade", free: false, teaser: "Script de 3 partes + prática diária" },
        { title: "Critérios de segurança relacional", free: false, teaser: "Onde discordar não custa o amor" },
      ],
      partialSummary:
        "Suas respostas indicam um padrão de engolir o que sente para “manter a paz”. Você se adapta, minimiza, evita conflito — e depois explode, se afasta ou escolhe alguém que não te escuta de verdade.",
      partialBullets: [
        "Dificuldade de pedir o que precisa com clareza",
        "Medo de ser “pesada”, exigente ou demais",
        "Acúmulo de mágoa até o limite",
      ],
      mirror:
        "Callar para preservar o vínculo costuma destruir o vínculo por dentro. O padrão não é “ser tranquila”: é pagar com autoabandono a conta da relação.",
      what:
        "No auto-silenciamento, a prioridade é não incomodar. Você lê o humor do outro e se molda. Com o tempo, some a mulher com desejos — sobra a que aguenta. A raiva vira sintoma (cansaço, frieza, termos secos).",
      how:
        "Em relações repetidas, você pode ter aprendido que falar gera punição, abandono ou caos. Então escolhe engolir. O parceiro se acostuma com uma versão reduzida de você — e o ciclo confirma: “não adianta falar”.",
      triggers: [
        "Parceiro irritadiço ou que “não gosta de drama”",
        "Momentos em que pedir algo parece egoísmo",
        "Comparação com “mulheres mais fáceis”",
        "Medo de solidão se colocar limite",
      ],
      beliefs: [
        "“Se eu falar, ele vai embora.”",
        "“Minha dor é exagero.”",
        "“É melhor engolir do que brigar.”",
        "“Eu aguento mais do que as outras.”",
      ],
      signals: [
        "Você diz “tanto faz” quando não tanto faz",
        "Chora sozinha e chega sorrindo",
        "Sabe o que ele quer; ele quase não sabe o que você quer",
        "Estoura por algo “pequeno” depois de meses calada",
      ],
      techniques: [
        {
          title: "Micro-assertividade diária",
          body: "Uma vez por dia, diga uma preferência pequena e real: “prefiro esse restaurante”, “hoje não quero sair”. Treina o músculo sem começar pelo conflito máximo.",
        },
        {
          title: "Script de 3 partes",
          body: "“Quando [fato], eu sinto [emoção]. Eu preciso [pedido concreto].” Ex.: “Quando os planos mudam em cima da hora, eu me sinto desconsiderada. Preciso de aviso com um dia.” Sem biografia, sem ataque.",
        },
        {
          title: "Limite com consequência",
          body: "Todo limite precisa de consequência calma: “Se gritar, eu encerro a conversa e volto em 1h.” Cumprir uma vez vale mais que explicar dez.",
        },
        {
          title: "Teste de segurança relacional",
          body: "Traga um pedido médio e observe: ele escuta, ridiculariza ou pune? A resposta dele é dado sobre o relacionamento — não sobre o seu “valor”.",
        },
      ],
      criteria: [
        "Espaço para discordar sem medo",
        "Curiosidade real sobre o que você sente",
        "Reparos depois de conflito (não só “deixa pra lá”)",
        "Você consegue ser específica sem se punir depois",
      ],
    },

    familiar: {
      id: "familiar",
      name: "Repetição do Familiar (Dor Conhecida)",
      offerPersonal: "Não é azar de “sempre o mesmo tipo”: é o mapa interno reencenando um clima conhecido.",
      offerHook:
        "O parcial já tirou a culpa do “azar”. O completo mostra o alarme de familiaridade e como escolher o “estranho saudável” sem sabotar quando está bom demais.",
      chapters: [
        { title: "Raio-X do seu histórico", free: true, teaser: "Já liberado no parcial" },
        { title: "Gatilhos da dor conhecida", free: false, teaser: "O “é ele” que é a história antiga" },
        { title: "Crenças de conquista e merecimento", free: false, teaser: "Amor tem que doer um pouco?" },
        { title: "Sinais de reencenação", free: false, teaser: "Amigas veem antes de você" },
        { title: "Técnicas: mapa de 3 relações + alarme", free: false, teaser: "Ferramentas de quebra de roteiro" },
        { title: "Critérios para um final diferente", free: false, teaser: "Atração sem provar valor o tempo todo" },
      ],
      partialSummary:
        "Suas respostas sugerem que o que te atrai não é só a pessoa — é o clima emocional conhecido (mesmo quando dói). O sistema busca o “já vivido”, confundindo familiaridade com destino ou química.",
      partialBullets: [
        "Parceiros diferentes com o mesmo tipo de conflito",
        "Sensação de “já vivi isso” cedo demais",
        "Dificuldade de sustentar relações emocionalmente novas/seguras",
      ],
      mirror:
        "A repetição não é azar: é o mapa interno tentando resolver uma história antiga com rostos novos. Enxergar isso tira a culpa e devolve escolha.",
      what:
        "Em psicologia, fala-se em compulsão à repetição: reencenar dinâmicas antigas na esperança de um final diferente. O corpo reconhece o clima (frieza, crítica, abandono, caos) e chama de “conexão”.",
      how:
        "Se na origem houve inconsistência, crítica ou ausência, o adulto pode se sentir “em casa” exatamente nesses climas. Relações saudáveis geram estranheza — e são abandonadas antes de virar laço.",
      triggers: [
        "Parceiro emocionalmente similar a figura importante do passado",
        "Começo que “parece filme” da sua história",
        "Você se sentindo “desafiada a provar valor”",
        "Paz prolongada gerando inquietação (“algo está errado”)",
      ],
      beliefs: [
        "“É o meu tipo.”",
        "“Amor tem que ser conquistado.”",
        "“Se for fácil, não é para mim.”",
        "“Eu só me apego quando dói um pouco.”",
      ],
      signals: [
        "Amigas veem o padrão antes de você",
        "Você defende o parceiro com a mesma narrativa de outros fins",
        "Relatos de infância/família ecoam no namoro atual",
        "Você sabota quando está “bom demais”",
      ],
      techniques: [
        {
          title: "Mapa de 3 relações",
          body: "Em uma página: para os 3 últimos vínculos, escreva início, conflito central, o que você fez, como terminou. Marque o que se repete em vermelho. Isso vira o seu raio-x — sem filosofia solta.",
        },
        {
          title: "Alarme de familiaridade",
          body: "Quando sentir “é ele”, pergunte: estou reconhecendo segurança ou reconhecendo a dor antiga? Se a resposta for dor antiga, desacelere 30 dias antes de se entregar.",
        },
        {
          title: "Escolha deliberada do “estranho saudável”",
          body: "Liste 3 traços de parceiro seguro que te parecem “sem graça”. Pratique valorizá-los por 60 dias em contatos reais. O cérebro reaprende atração com repetição, não com discurso.",
        },
        {
          title: "Carta não enviada (integração)",
          body: "Escreva à versão mais nova de você o que ela precisava ouvir. Feche com: “Hoje eu escolho não reencenar isso.” Use em momentos de queda no padrão antigo.",
        },
      ],
      criteria: [
        "Atração + respeito sem precisar “provar” valor o tempo todo",
        "História emocional diferente da sua ferida central",
        "Você se sente expandida, não diminuída, após os encontros",
        "Consegue sustentar calma sem fabricar crise",
      ],
    },
  },

  signs: [
    { name: "Áries", symbol: "♈" },
    { name: "Touro", symbol: "♉" },
    { name: "Gêmeos", symbol: "♊" },
    { name: "Câncer", symbol: "♋" },
    { name: "Leão", symbol: "♌" },
    { name: "Virgem", symbol: "♍" },
    { name: "Libra", symbol: "♎" },
    { name: "Escorpião", symbol: "♏" },
    { name: "Sagitário", symbol: "♐" },
    { name: "Capricórnio", symbol: "♑" },
    { name: "Aquário", symbol: "♒" },
    { name: "Peixes", symbol: "♓" },
  ],

  /**
   * Todas as perguntas são multi (marcar). minSelect: 1, salvo allowEmpty.
   */
  questions: [
    {
      id: "q1",
      type: "multi",
      axis: "Raio-X do histórico",
      image: "images/q1.jpg",
      imageAlt: "Mulher refletindo sobre relações passadas",
      text: "Nas suas relações importantes, o que costuma se repetir no final?",
      help: "Marque tudo o que já aconteceu mais de uma vez.",
      minSelect: 1,
      options: [
        { label: "Eu me sinto abandonada ou “de menos”, mesmo juntas", scores: { anxious: 2, familiar: 1 } },
        { label: "Eu carrego a relação sozinha até não aguentar", scores: { savior: 2, silence: 1 } },
        { label: "Muita paixão e briga; explosão ou some-e-volta", scores: { intensity: 2, anxious: 1 } },
        { label: "Eu me calo por meses e um dia desisto", scores: { silence: 2, familiar: 1 } },
      ],
    },
    {
      id: "q2",
      type: "multi",
      axis: "Raio-X do histórico",
      image: "images/q2.jpg",
      imageAlt: "Início de uma conexão afetiva",
      text: "No começo de um envolvimento, o que costuma te fisgar?",
      help: "Pode marcar mais de um — o corpo às vezes responde a várias coisas.",
      minSelect: 1,
      options: [
        { label: "Sensação de que ele “me escolheu” e conexão imediata", scores: { anxious: 2, intensity: 1 } },
        { label: "Vontade de ajudar, cuidar ou “tirar ele do buraco”", scores: { savior: 2 } },
        { label: "Química forte, mesmo sem muita compatibilidade prática", scores: { intensity: 2 } },
        { label: "Ele parece seguro — mas eu desconfio ou me entedio cedo", scores: { familiar: 2, intensity: 1 } },
      ],
    },
    {
      id: "q3",
      type: "multi",
      axis: "Mapa dos gatilhos",
      image: "images/q3.jpg",
      imageAlt: "Mulher aguardando mensagem no celular",
      text: "Quando ele demora e o tom esfria, o que acontece em você?",
      help: "Marque o que for verdadeiro, mesmo que “feio” de admitir.",
      minSelect: 1,
      options: [
        { label: "Peito aperta; fico no celular imaginando o pior", scores: { anxious: 2 } },
        { label: "Pergunto se ele está bem e ofereço ajuda", scores: { savior: 2, anxious: 1 } },
        { label: "Raiva e desejo ao mesmo tempo; o silêncio me prende", scores: { intensity: 2, anxious: 1 } },
        { label: "Finjo que não ligo e fico magoada em silêncio", scores: { silence: 2 } },
      ],
    },
    {
      id: "q4m",
      type: "multi",
      axis: "Mapa dos gatilhos",
      image: "images/q4.jpg",
      imageAlt: "Mulher emocionalmente desestabilizada",
      text: "Marque o que já te desestabilizou de forma repetida:",
      help: "Quanto mais honesta a lista, mais preciso o mapa.",
      minSelect: 1,
      options: [
        { label: "Demora / silêncio / respostas frias", scores: { anxious: 2 } },
        { label: "Ele em crise e eu tentando “salvar”", scores: { savior: 2 } },
        { label: "Ciúme, hot-and-cold ou montanha-russa", scores: { intensity: 2, anxious: 1 } },
        { label: "Precisar brigar para ser ouvida", scores: { silence: 2 } },
        { label: "Sensação de “já vivi esse filme” com outro homem", scores: { familiar: 2 } },
        { label: "Medo de ficar sozinha se eu colocar limite", scores: { anxious: 1, silence: 1 } },
      ],
    },
    {
      id: "q5",
      type: "multi",
      axis: "Crenças que te prendem",
      image: "images/q5.jpg",
      imageAlt: "Mulher diante do espelho, reflexão interna",
      text: "Quais frases internas aparecem em você na crise?",
      help: "Mesmo as que você “sabe” que não são verdade.",
      minSelect: 1,
      options: [
        { label: "“Se eu for mais amorosa, ele não me deixa.”", scores: { anxious: 2, savior: 1 } },
        { label: "“Se eu não segurar, ninguém segura.”", scores: { savior: 2 } },
        { label: "“Amor de verdade dói; se está fácil, não é real.”", scores: { intensity: 2, familiar: 1 } },
        { label: "“Não adianta falar; melhor engolir.”", scores: { silence: 2 } },
      ],
    },
    {
      id: "q6",
      type: "multi",
      axis: "Crenças que te prendem",
      image: "images/q6.jpg",
      imageAlt: "Mulher sozinha em um café",
      text: "Sobre ficar sozinha, o que combina com você hoje?",
      help: "Sem julgamento — só honestidade.",
      minSelect: 1,
      options: [
        { label: "Me assusta; prefiro vínculo imperfeito a vazio", scores: { anxious: 2 } },
        { label: "Aguento sozinha, mas sinto culpa se “abandonar” alguém em crise", scores: { savior: 2, silence: 1 } },
        { label: "Sozinha é ok até aparecer alguém que me tire do chão", scores: { intensity: 2 } },
        { label: "Sozinha é mais fácil do que pedir e me expor", scores: { silence: 2, familiar: 1 } },
      ],
    },
    {
      id: "q7",
      type: "multi",
      axis: "Leitura dos sinais",
      image: "images/q7.jpg",
      imageAlt: "Conversa sincera entre amigas",
      text: "O que amigas (ou você mesma) já apontaram e você minimizou?",
      help: "Marque o que já tocou de verdade.",
      minSelect: 1,
      options: [
        { label: "“Você se anula demais por medo de perder.”", scores: { anxious: 2, silence: 1 } },
        { label: "“Você não é a mãe/terapeuta dele.”", scores: { savior: 2 } },
        { label: "“Isso é drama, não é amor.”", scores: { intensity: 2 } },
        { label: "“Você nunca fala o que quer de verdade.”", scores: { silence: 2 } },
      ],
    },
    {
      id: "q8m",
      type: "multi",
      axis: "Leitura dos sinais",
      image: "images/q8.jpg",
      imageAlt: "Momento calmo que ainda gera inquietação",
      text: "Marque os sinais de alerta que você já ignorou:",
      help: "Por carência, impulso ou esperança de que mude.",
      minSelect: 1,
      options: [
        { label: "Promessas grandes sem mudança de comportamento", scores: { intensity: 1, anxious: 1 } },
        { label: "Eu explico o básico de respeito mais de uma vez", scores: { silence: 1, savior: 1 } },
        { label: "Amigas veem bandeira vermelha e eu “defendo” ele", scores: { familiar: 2, intensity: 1 } },
        { label: "Só me sinto segura quando ele confirma o afeto", scores: { anxious: 2 } },
        { label: "A relação só “funciona” com crise ou intensidade", scores: { intensity: 2 } },
        { label: "Eu diminuo o que sinto para não ser “pesada”", scores: { silence: 2 } },
      ],
    },
    {
      id: "q9",
      type: "multi",
      axis: "Comportamento no conflito",
      image: "images/q9.jpg",
      imageAlt: "Tensão em uma conversa de casal",
      text: "Numa discussão, o que você costuma fazer?",
      help: "Marque o que já se repetiu.",
      minSelect: 1,
      options: [
        { label: "Insisto em conversar agora para me acalmar", scores: { anxious: 2 } },
        { label: "Assumo a culpa ou o papel de mediadora", scores: { savior: 1, silence: 2 } },
        { label: "A discussão esquenta; a reconciliação é intensa", scores: { intensity: 2 } },
        { label: "Me retiro, fico em silêncio e processo sozinha", scores: { silence: 2, familiar: 1 } },
      ],
    },
    {
      id: "q10",
      type: "multi",
      axis: "Plano de quebra de padrão",
      image: "images/q10.jpg",
      imageAlt: "Mulher estabelecendo um limite com calma",
      text: "Sobre limites (tempo, respeito, exclusividade), o que é verdade?",
      help: "Marque o que combina com você.",
      minSelect: 1,
      options: [
        { label: "Tenho limites na cabeça, mas afrouxo com medo de perder", scores: { anxious: 2, silence: 1 } },
        { label: "Para ele, abro exceção “porque precisa”", scores: { savior: 2 } },
        { label: "Limite rígido parece falta de paixão; caio na montanha-russa", scores: { intensity: 2 } },
        { label: "Quase não coloco limite em voz alta; espero que ele perceba", scores: { silence: 2 } },
      ],
    },
    {
      id: "q11m",
      type: "multi",
      axis: "Centro e proteção",
      image: "images/q11.jpg",
      imageAlt: "Mulher em momento de centro e reflexão",
      text: "O que você já tentou para se proteger emocionalmente?",
      help: "Pode marcar várias — ou nenhuma, se preferir.",
      minSelect: 0,
      allowEmpty: true,
      options: [
        { label: "Oração, meditação ou silêncio diário", scores: {} },
        { label: "Terapia ou aconselhamento", scores: {} },
        { label: "Conversar com amigas", scores: {} },
        { label: "Jurar “agora vai ser diferente” e repetir o ciclo", scores: { familiar: 1, anxious: 1 } },
        { label: "Evitar relacionamentos por um tempo", scores: { silence: 1 } },
        { label: "Ainda não tenho uma rotina de proteção", scores: { anxious: 1 } },
      ],
    },
    {
      id: "q12",
      type: "multi",
      axis: "Plano de quebra de padrão",
      image: "images/q12.jpg",
      imageAlt: "Mulher seguindo em frente com clareza",
      text: "O que você mais quer mudar antes do próximo relacionamento?",
      help: "Marque o que for prioridade para você.",
      minSelect: 1,
      options: [
        { label: "Parar de decidir no desespero", scores: { anxious: 2 } },
        { label: "Parar de escolher quem eu preciso “salvar”", scores: { savior: 2 } },
        { label: "Parar de confundir intensidade com compatibilidade", scores: { intensity: 2 } },
        { label: "Conseguir falar o que preciso sem me trair", scores: { silence: 2, familiar: 1 } },
      ],
    },
  ],
};
