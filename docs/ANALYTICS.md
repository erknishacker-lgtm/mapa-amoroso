# Tracking estilo Enlead (1 linha = 1 pessoa)

## Modelo

| Conceito | Implementação |
|----------|----------------|
| Cada visitante | 1 registro em `quiz_leads` (`lead_id`) |
| Esteira de respostas | Coluna JSON `answers` → no painel vira colunas P1…P12 |
| Parou no meio | Células seguintes ficam vazias |
| % por pergunta | `step_funnel` no painel (quantos % dos leads chegaram em cada passo) |
| Meta ads | UTMs, fbclid, fbp, fbc, gclid… |
| Device / local | user-agent + geo best-effort (geojs) |

## Setup (obrigatório se ainda não rodou o SQL novo)

1. Supabase → **SQL Editor**
2. Cole e rode **todo** o arquivo `supabase/schema.sql` (substitui o modelo antigo)
3. `config.js` já com URL + chave
4. Painel: `/admin/` senha `mapa2026`

## Fluxo no quiz

1. Abre landing → cria/atualiza lead  
2. Clica começar → marca step `start`  
3. Perfil → nome/signo  
4. Cada pergunta → grava respostas na **mesma linha**  
5. Resultado → `completed_at` + padrão  
6. Checkout → `checkout_clicked_at`  

## Painel

- KPIs grandes  
- Cards de **% por passo** (gargalo em vermelho)  
- Gráficos **dia** e **hora**  
- Respostas mais marcadas  
- **Tabela esteira** (linha = pessoa, coluna = pergunta)  
