# Convenções de código — SGB API

Documento curto e normativo. A regra vale para código novo e para qualquer
arquivo tocado num PR. Em caso de dúvida entre "seguir a convenção" e
"seguir o que o arquivo vizinho faz", a convenção ganha.

## 1. Nomes de arquivo

Sempre `kebab-case` com sufixo que declara o tipo:

```
<assunto>.<tipo>.ts
```

| Tipo             | Sufixo            | Exemplo                            |
| ---------------- | ----------------- | ---------------------------------- |
| Módulo           | `.module.ts`      | `scholarship.module.ts`            |
| Controller       | `.controller.ts`  | `scholarship.controller.ts`        |
| Service          | `.service.ts`     | `scholarship.service.ts`           |
| Mapper           | `.mapper.ts`      | `scholarship.mapper.ts`            |
| Repositório      | `.repository.ts`  | `scholarship.repository.ts`        |
| Entidade         | `.entity.ts`      | `scholarship.entity.ts`            |
| DTO              | `.dto.ts`         | `create-scholarship.dto.ts`        |
| Enum             | `.enum.ts`        | `status.enum.ts`                   |
| Interface / tipo | `.interface.ts`   | `scholarship-filters.interface.ts` |
| Guard            | `.guard.ts`       | `roles.guard.ts`                   |
| Strategy         | `.strategy.ts`    | `jwt.strategy.ts`                  |
| Decorator        | `.decorator.ts`   | `role.decorator.ts`                |
| Constraint       | `.constraint.ts`  | `is-strong-password.constraint.ts` |
| Exception        | `.exception.ts`   | `custom-validation.exception.ts`   |
| Exception filter | `.filter.ts`      | `http-exception.filter.ts`         |
| Função utilitária| `.util.ts`        | `date.util.ts`                     |
| Teste            | `.spec.ts`        | `scholarship.service.spec.ts`      |

Proibido: `PascalCase.ts`, prefixo húngaro (`IFoo.ts`), sufixo no plural
(`.utils.ts`) e sufixo com hífen (`date-utils.ts`).

Exceções deliberadas, por serem referenciadas de fora do TypeScript:
`main.ts`, `config/ormconfig.ts` (scripts npm) e `common/testing/setup.ts`
(`vitest.config.mts`). As migrations mantêm o nome gerado pelo TypeORM
(`<timestamp>-<descricao>.ts`).

## 2. Pastas

### 2.1 Plural, sempre

`dtos/`, `entities/`, `mappers/`, `repositories/`, `guards/`, `strategies/`,
`decorators/`, `utils/`, `constraints/`, `filters/`. Nunca no singular.

### 2.2 Um arquivo não ganha pasta

Se uma categoria tem **um** arquivo, ele fica na raiz da feature:

```
✗ agency/service/agency.service.ts
✓ agency/agency.service.ts
```

Duas exceções, porque sempre crescem: `dtos/` e `entities/` mantêm a pasta
mesmo com um arquivo só.

### 2.3 Anatomia de uma feature

```
<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.mapper.ts
  dtos/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
  entities/
    <feature>.entity.ts
  repositories/            # a partir do passo 3 do refactor
    <feature>.repository.ts
    typeorm-<feature>.repository.ts
```

O arquivo de teste mora **ao lado** do arquivo que testa, nunca numa pasta
`__tests__` separada.

## 3. Imports

- **Entre pastas diferentes: sempre o alias `@/`.** Nunca `../`.
- **Mesma pasta: `./`.**

```ts
✓ import { Scholarship } from '@/scholarship/entities/scholarship.entity'
✓ import { helper } from './pdf-reports.helper'
✗ import { Scholarship } from '../entities/scholarship.entity'
```

Motivo: `../` quebra a cada arquivo movido. Com `@/`, mover um arquivo dentro
da própria feature não toca em import nenhum.

## 4. Dependências entre camadas

A direção é sempre uma só:

```
controller  ->  service  ->  repository  ->  banco
```

Regras:

1. **Controller não acessa repositório nem entidade do TypeORM.** Ele fala com
   o service e devolve DTO.
2. **Service não importa outro service de domínio.** Se precisa de dado de
   outro domínio, injeta o *repositório* daquele domínio.
3. Orquestração real entre domínios (ex.: importação de CSV que mexe em três
   agregados) mora num service de orquestração explícito, que pode depender de
   vários repositórios — e é o único lugar onde isso é permitido.
4. **Service não injeta `Repository<T>` do TypeORM direto.** Injeta a classe
   abstrata do repositório da feature; o binding concreto vive no
   `DatabaseModule`.

A regra 4 chega no passo 3 do refactor; até então valem 1, 2 e 3 para código novo.

## 5. Comentários

Código bom não precisa de narração. Não comente o que o nome já diz:

```ts
✗ /** Busca a agência pelo id. */
  abstract findById(id: number): Promise<Agency | null>

✗ // Cria o service
  const service = new AgencyService(repository)
```

Comente só o que o código não consegue contar — e aí explique o **porquê**,
não o quê:

```ts
✓ /**
   * Recebe a entidade, e não o id, porque o save precisa levar as relações
   * carregadas pelo findByIdWithScholarships.
   */
```

O teste prático: se alguém pode ler o comentário e "corrigir" o código de
volta para o jeito errado sem ele, o comentário se paga. Caso contrário,
apague. Um nome melhor vale mais que um comentário.

## 6. Onde as coisas vão

| Escopo                          | Lugar             |
| ------------------------------- | ----------------- |
| Usado por uma feature só        | dentro da feature |
| Usado por duas ou mais features | `common/`         |
| Configuração / bootstrap        | `config/`         |

Não crie uma segunda pasta de utilitários. Se é compartilhado, vai em
`common/utils/`.

## 7. Tratamento de erros

Um erro vira resposta HTTP em um lugar só: o `AllExceptionsFilter`
(`common/filters/all-exceptions.filter.ts`). Todo erro sai como
`{ "statusCode": number, "message": string }`.

### 7.1 No service

- **Erro esperado** (regra de negócio, registro inexistente, sem permissão):
  lance a exceção HTTP do Nest com mensagem de `constants`.
- **Erro inesperado** (banco fora do ar, bug, resposta estranha de outro
  serviço): não capture. Deixe subir.
- Não envolva o método em `try/catch` só para trocar o erro por outro. Isso
  troca 404 e 409 por 400, esconde a causa do log e, quando repassa
  `error.message`, entrega texto do banco para o cliente.
- `try/catch` só existe quando o código faz algo com a falha: desfazer um
  cadastro, seguir para o próximo item de um cron, ignorar uma notificação
  que não é essencial. Nesses casos, registre a falha com a stack.

```ts
✗ try {
    return await this.repository.create(dto)
  } catch (error) {
    throw new BadRequestException(error.message)
  }

✓ return await this.repository.create(dto)
```

### 7.2 Status

| Situação                                         | Status | Exceção                        |
| ------------------------------------------------ | ------ | ------------------------------ |
| Corpo ou parâmetro fora do formato (DTO)         | 422    | `ValidationPipe` (automático)  |
| Regra de negócio violada                         | 400    | `BadRequestException`          |
| Sem token ou token inválido                      | 401    | guards                         |
| Logado, mas sem permissão                        | 403    | `ForbiddenException`           |
| Registro não existe (ou não é de quem pede)      | 404    | `NotFoundException`            |
| Já existe registro com os mesmos dados           | 409    | `ConflictException`            |
| Muitas tentativas                                | 429    | `ThrottlerGuard` (automático)  |
| Erro inesperado                                  | 500    | nenhuma: deixe o erro subir    |

Erros do Postgres que chegam ao filtro são traduzidos sem repassar a mensagem
do banco: unicidade (`23505`) e chave estrangeira (`23503`) viram 409, dado
fora do formato da coluna (`22001`, `22007`, `22008`, `22P02`, `23502`) vira
400, e o resto vira 500.

### 7.3 Log

- O filtro registra toda resposta 5xx com a rota e a stack, e todo erro do
  banco traduzido para 4xx com o código e a constraint. O cliente nunca vê
  nenhum dos dois.
- O service não registra o erro que ele mesmo lança: um 4xx de regra de
  negócio é resposta esperada, não falha.
- `logger.error(mensagem, stack)`: o segundo argumento é a stack
  (`error.stack`), não o objeto do erro.
