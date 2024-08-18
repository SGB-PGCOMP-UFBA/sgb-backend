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
