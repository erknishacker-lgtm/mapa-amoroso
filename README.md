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

## Analytics (funil, perguntas, respostas, dia/hora)

Painel: `/admin/`

1. Rode `supabase/schema.sql` no SQL Editor do Supabase  
2. Preencha `config.js` com URL + anon key  
3. Entre em `/admin/` com a senha (`mapa2026` por padrão — troque no SQL)

Detalhes: [docs/ANALYTICS.md](docs/ANALYTICS.md)
