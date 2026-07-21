<!-- SEED atualizado: visual carta simples branco/preto/vermelho -->
---
name: Mapa do Padrão Amoroso
description: Quiz de padrão amoroso — carta simples, resultado parcial grátis, mapa completo R$9,97.
---

# Design System: Mapa do Padrão Amoroso

## 1. Overview

**Creative North Star: "Carta clara no papel branco"**

Referência de atmosfera: páginas de oferta longas e legíveis (ex.: estilo text-page limpo — fundo branco, hierarquia forte, ênfase em vermelho nos pontos de dor e CTAs). Sem escuridão mística, sem constelações decorativas, sem app de namoro.

A mulher lê e responde no celular como quem preenche um raio-x sério: tipografia legível, poucas cores, botão vermelho de ação.

**Key Characteristics:**

- Fundo branco, texto preto, destaques e CTA em vermelho (#e10600)
- Uma pergunta por tela no quiz; progresso simples
- Resultado parcial + bloco “bloqueado” + preço R$ 9,97
- Zero glassmorphism, zero dark mode de marca

## 2. Colors

### Primary

- **Vermelho de ênfase / CTA** (#e10600): spans de dor na copy, botões, barra de progresso, preço.

### Neutral

- **Branco** (#ffffff): fundo da página.
- **Preto** (#111111): títulos e corpo.
- **Cinza texto** (#444444 / #666666): secundário.
- **Cinza linha / painel** (#e5e5e5 / #f7f7f7): separadores e boxes.

### Named Rules

**The Paper Rule.** O fundo é branco. A cor de marca quase só aparece em ênfase e botões.

**The Red Means Decision Rule.** Vermelho = dor nomeada na copy ou ação (avançar / pagar). Não usar vermelho decorativo em tudo.

## 3. Typography

**Display / títulos:** Georgia (serif de sistema) para peso de “carta”.  
**UI / botões / opções:** system-ui / Segoe / Roboto.

### Hierarchy

- Hero e nomes de padrão: serif bold, grande.
- Perguntas: serif ou sans bold, ~1.4–1.6rem.
- Corpo e opções: sans, ~0.95–1.1rem.
- Microcopy e disclaimer: 0.75–0.85rem, cinza.

## 4. Elevation

Flat. Bordas 1px cinza. Sem sombras largas. Painéis com fundo #f7f7f7.

## 5. Components

- Botão primário: retângulo/bloco vermelho, texto branco, full-width no mobile.
- Opção de quiz: borda cinza; selecionada = borda vermelha + fundo rosa muito claro.
- Barra de progresso: trilha cinza, fill vermelho.
- Painel bloqueado: blur + overlay “Desbloqueie por R$ 9,97”.

## 6. Do's and Don'ts

### Do:

- Do manter contraste preto/branco alto.
- Do destacar só frases-chave em vermelho.
- Do mostrar resultado parcial honesto e completar no pago.
- Do incluir disclaimer de não-substituição de terapia.

### Don't:

- Don't usar tema escuro de “observatório” / constelações.
- Don't parecer Tinder rosa ou quiz de revista pastel.
- Don't usar gradientes, glass, cards flutuantes de SaaS.
- Don't prometer cura clínica ou diagnóstico de transtorno.
