# Mapa do Padrão Amoroso

Quiz / funil de padrão amoroso. Deploy estático na Vercel.

## Local

```bash
npx serve .
# ou: python3 -m http.server 5173
```

## Vercel

- Root Directory: `.` (raiz)
- Framework: Other / static
- Build Command: (vazio)
- Output Directory: `.`

Checkout: https://lastlink.com/p/C53821E2C/checkout-payment/

## Analytics estilo Enlead (1 linha = 1 pessoa)

Painel: **`/admin/`**

1. Rode o arquivo **`supabase/schema.sql`** no SQL Editor (modelo novo `quiz_leads`)  
2. `config.js` com URL + chave (já configurável)  
3. Senha do painel: **`mapa2026`** (troque no SQL se quiser)

O painel mostra: % por etapa, gargalos, respostas mais marcadas, gráficos dia/hora e a **esteira** (cada linha uma pessoa, colunas = perguntas).

Detalhes: [docs/ANALYTICS.md](docs/ANALYTICS.md)
