# Bônus exclusivos — Mapa do Ciclo Amoroso

Cartilhas digitais em PDF (estilo passo a passo) inclusas na compra do **Mapa Completo**.

| # | Nome | Nome comercial | Valor percebido | PDF |
|---|------|----------------|-----------------|-----|
| 1 | Ritual de Limpeza e Renovação Emocional | Banho de Renovação Amorosa | R$ 27 | [pdf/Bonus-01-…](pdf/Bonus-01-Ritual-Limpeza-Renovacao-Emocional.pdf) |
| 2 | Ritual de Desapego da Relação Confusa | Ritual de Corte da Confusão Emocional* | R$ 37 | [pdf/Bonus-02-…](pdf/Bonus-02-Ritual-Desapego-Relacao-Confusa.pdf) |
| 3 | Kit de Proteção Emocional para Dias de Recaída | Escudo de Proteção Emocional | R$ 47 | [pdf/Bonus-03-…](pdf/Bonus-03-Kit-Protecao-Emocional-Recaida.pdf) |

**Valor percebido total: R$ 111** (incluídos sem custo adicional — não são preços anteriores de venda avulsa).

\* “Corte” = prática **simbólica** de desapego, não promessa de efeito energético literal.

## Pasta

```
bonus/
├── index.html              ← página de apresentação do pacote
├── bonus-01-….html         ← fontes editáveis das cartilhas
├── bonus-02-….html
├── bonus-03-….html
├── assets/cartilha.css     ← identidade visual
├── build_pdfs.py           ← regerar PDFs
└── pdf/                    ← arquivos finais para entrega
```

## Regenerar PDFs

```bash
cd bonus && python3 build_pdfs.py
```

Requer Playwright + Chromium (`python3 -m playwright install chromium` se necessário).

## Entrega à cliente

1. Anexar os 3 PDFs no e-mail / área de membros do Lastlink, **ou**
2. Enviar o link da pasta `/bonus/` no site após a compra.

## Tom e limites

- Linguagem acolhedora, feminina, brasileira  
- Sem diagnóstico clínico  
- Sem promessa de trazer alguém de volta ou efeito sobrenatural  
- Disclaimer de autoconhecimento em todas as cartilhas  
