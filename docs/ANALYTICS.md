# Analytics do quiz — setup

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. **SQL Editor** → cole e rode o arquivo `supabase/schema.sql`.
3. (Opcional) Troque a senha do admin:

```sql
update public.app_settings
set value = 'sua_senha_forte'
where key = 'admin_password';
```

Senha padrão do schema: `mapa2026`

## 2. Colar as chaves no site

1. Supabase → **Project Settings → API**
2. Copie **Project URL** e **anon public** key
3. Edite `config.js` na raiz do repo:

```js
window.MAPA_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",
  timezoneLabel: "America/Sao_Paulo",
};
```

4. Commit + push (ou configure no Vercel se preferir injetar depois).

## 3. Painel

Abra: `https://seu-dominio.vercel.app/admin/`

- Filtros: hoje / 7 / 30 dias ou datas manuais
- Funil, % por pergunta, respostas mais marcadas, gráficos por dia e por hora

## Eventos gravados

| event_type | Quando |
|------------|--------|
| landing | Abriu a home |
| start | CTA começar |
| profile | Nome/signo ou pular |
| question_view | Viu a pergunta |
| question_answer | Confirmou opções e avançou |
| question_next | Avançou (junto do answer) |
| result | Viu resultado |
| checkout | Clicou pagar |
| restart | Refazer mapa |

## Privacidade

- Sessão anônima (`localStorage`)
- Nome/signo só se a pessoa preencher (meta do profile/result)
- RLS: anônimo só **insere** eventos; leitura só via função `admin_analytics` com senha
