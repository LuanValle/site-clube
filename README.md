# Clube Filatelico do Amazonas

Site do Clube Filatelico do Amazonas com frontend estatico, painel administrativo e base backend serverless para Vercel + Neon Postgres.

## O que existe hoje

- Home institucional responsiva.
- Paginas: Inicio, O Clube, Filatelia, Biblioteca, Noticias, Associe-se e Contato.
- Painel admin preparado para edicao de conteudo.
- Login admin integrado a API.
- APIs serverless em `api/`.
- Schema Postgres em `db/schema.sql`.
- Configuracao Vercel em `vercel.json`.

## Estrutura

- `index.html`: pagina inicial.
- `clube.html`: historia, missao, visao, valores, diretoria e parceiros.
- `publicacoes.html`: area Filatelia.
- `biblioteca.html`: biblioteca digital.
- `noticias.html`: noticias do clube.
- `login.html`: acesso do associado e admin.
- `admin.html`: painel de gestao editorial.
- `app.js`: integracao do frontend com API.
- `styles.css`: layout, tema e responsividade.
- `api/login.js`: login administrativo.
- `api/news/`: CRUD de noticias.
- `api/library/`: CRUD de itens da biblioteca e links do Drive.
- `lib/`: banco, auth, HTTP e normalizacao de conteudo.
- `db/schema.sql`: tabelas e indices para Neon/Postgres.
- `assets/`: imagens otimizadas e arquivos visuais.

## Banco de dados

Use Neon Postgres. Crie um projeto no Neon e execute `db/schema.sql` no SQL Editor.

Depois crie o usuario admin inicial com hash bcrypt. Exemplo:

```sql
insert into admin_users (username, password_hash)
values ('admin', crypt('SENHA_FORTE_AQUI', gen_salt('bf')));
```

Troque `SENHA_FORTE_AQUI` por uma senha real antes de executar. Nunca coloque a senha real no repositorio.

## Variaveis de ambiente

Configure na Vercel, em Project Settings > Environment Variables:

- `DATABASE_URL`: connection string do Neon.
- `ADMIN_JWT_SECRET`: segredo longo e aleatorio para assinar tokens.

Nao use prefixos publicos como `NEXT_PUBLIC_` ou `VITE_` nessas variaveis.

## Rotas da API

- `POST /api/login`
  - body: `{ "username": "...", "password": "..." }`
  - retorna token Bearer.

- `GET /api/news`
  - lista noticias publicadas.

- `POST /api/news`
  - cria noticia.
  - requer header `Authorization: Bearer <token>`.

- `GET /api/news/:id`
- `PATCH /api/news/:id`
- `DELETE /api/news/:id`

- `GET /api/library`
  - lista itens publicados da biblioteca.

- `POST /api/library`
  - cria item da biblioteca com `driveUrl`.
  - requer token admin.

- `GET /api/library/:id`
- `PATCH /api/library/:id`
- `DELETE /api/library/:id`

## Desenvolvimento local

Instale dependencias:

```bash
npm install
```

Rode com Vercel local:

```bash
npm run dev
```

Se estiver no Windows PowerShell e `npm` for bloqueado pela politica de execucao, use:

```powershell
npm.cmd install
npm.cmd run dev
```

## Publicacao

Este diretorio ja possui `.vercel/project.json`, ligado ao projeto Vercel `site-franca`.

Fluxo recomendado:

1. Conectar o repositorio GitHub ao projeto `site-franca` na Vercel.
2. Configurar `DATABASE_URL` e `ADMIN_JWT_SECRET` na Vercel.
3. Fazer push para o GitHub.
4. A Vercel faz deploy automatico a cada push.

## Seguranca

- Nao ha senha admin hardcoded no frontend.
- Senhas ficam no banco apenas como hash.
- `DATABASE_URL` e segredos ficam somente nas variaveis privadas da Vercel.
- `vercel.json` define headers de seguranca, CSP, `nosniff`, bloqueio de iframe e `no-store`/`noindex` para admin.
- Rotas de escrita exigem token admin.

Melhoria futura recomendada: trocar token em `sessionStorage` por cookie `HttpOnly`, `Secure` e `SameSite`.

## Subagentes do projeto

- Backend: APIs serverless, Neon/Postgres, schema e integracao com admin.
- Seguranca: headers, ausencia de segredos expostos, revisao de auth e rotas sensiveis.

