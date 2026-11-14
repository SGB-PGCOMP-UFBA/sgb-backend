# Sistema de Gerenciamento de Bolsas (API)

<p align="center">
    <img alt = "License" src="https://img.shields.io/github/license/SGB-PGCOMP-UFBA/sgb-backend">
    <img alt = "Languages" src="https://img.shields.io/github/languages/count/SGB-PGCOMP-UFBA/sgb-backend">
    <img alt = "Size" src="https://img.shields.io/github/repo-size/SGB-PGCOMP-UFBA/sgb-backend">
    <img alt = "Commit" src="https://img.shields.io/github/last-commit/SGB-PGCOMP-UFBA/sgb-backend">
    <img alt = "Issues" src="https://img.shields.io/github/issues/SGB-PGCOMP-UFBA/sgb-backend">
</p>

### Tecnologias utilizadas

-   ✳️ NodeJS.
-   ⚙️ Typescript.
-   🦁 NestJS.
-   🐘 PostreSQL.

### Instruções de instalação

```bash
# Crie um banco de dados postgres e anote as configurações de acesso no arquivo de variáveis de ambiente.

# Você precisa ter node em sua máquina para executar o projeto
$ node -v

# Clone este repositório na sua máquina:
$ git clone https://github.com/SGB-PGCOMP-UFBA/sgb-backend.git

# Abra a pasta do projeto
$ cd /sgb-backend

# Execute o npm install para instalar as dependências
$ npm install

# Inicie o projeto em modo desenvolvimento
$ npm run start:dev

# Os endpoints estarão disponíveis com a base em http://localhost:3333.
```

### Ambiente de testes e2e

Os testes e2e ficam no `sgb-frontend` (Playwright) e rodam no GitHub Actions,
que sobe banco, Mailpit, esta API e o front dentro do próprio job. Não existe
ambiente de teste hospedado, e o e2e nunca usa o banco de produção:

- Com `NODE_ENV=test`, a API só sobe com banco e SMTP em `localhost`.
- O seed (`npm run db:seed:e2e`) apaga as tabelas do domínio, por isso também
  exige `NODE_ENV=test` e um banco local cujo nome termine em `_e2e`.

Para reproduzir o ambiente na sua máquina:

```bash
# Postgres descartável na porta 5434 e Mailpit (e-mails em http://localhost:8025)
$ docker compose --profile e2e up -d

$ cp .env.e2e.example .env.e2e
$ npm run build

# Aplica as migrations e o seed no banco sgb_e2e
$ npm run e2e:prepare

# API do e2e em http://localhost:3334
$ npm run e2e:start
```

O seed cria um usuário de cada perfil, todos com a senha `E2e@Sgb1`
(`src/common/database/seeds/e2e-seed.util.ts`). Para trocar os dados, altere
esse arquivo e o espelho em `e2e/fixtures/users.ts` no front.

#### Requerimentos

-   Node.js >= 18.20.4
-   NPM >= 10.7.0
-   PostgreSQL >= 16.1

#### Estrutura dos diretórios

-   `.github` — Manter workflows de integração com o github.
-   `.vscode` — Manter estilos de codificação consistentes.
-   `src` — Código-fonte do aplicativo, incluindo páginas, componentes, estilos.

#### Scripts

-   `npm run build` — Cria uma compilação de produção otimizada do seu aplicativo.
-   `npm run db:migrate` — Cria as tabelas no banco de dados. (Lembre de criar localmente e definir as variávies de ambiente)
-   `npm run start:dev` — Inicia o aplicativo no modo de desenvolvimento em http://localhost:3333.
-   `npm run start:prod` — Inicia o aplicativo no modo de produção a partir do build gerado coom o `npm run build`.
