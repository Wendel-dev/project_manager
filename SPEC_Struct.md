# SPEC_Struct.md - Reestruturação de Subdomínios

Este documento detalha a migração de componentes para seus subdomínios corretos, resolvendo o acoplamento e a organização inconsistente identificada no diretório `src/`.

## 1. Visão Geral da Nova Estrutura

A estrutura seguirá os princípios de Clean Architecture e DDD, onde cada subdomínio possui suas próprias camadas (`application`, `infrastructure`, `model`).

```
src/
├── Auth/              # Subdomínio de Autenticação
├── Project/           # Subdomínio de Gerenciamento de Projetos (Antigo "Main")
├── Payment/           # Subdomínio de Pagamentos (Antigo "PaymentGatway")
├── UI/                # Frontend (Componentes, Contextos, Estilos)
├── Shared/            # Código compartilhado entre subdomínios
└── middleware/        # Middlewares globais (ou mover para Auth se for exclusivo)
```

## 2. Mapeamento de Migração

### 2.1 Subdomínio: Auth
Objetivo: Centralizar toda a lógica de autenticação.

| Arquivo Atual | Diretório Atual | Novo Diretório | Motivo |
| :--- | :--- | :--- | :--- |
| `AuthRepository.ts` | `src/Main/infrastructure/` | `src/Auth/infrastructure/` | Repositório pertence ao domínio Auth. |
| `AuthRepositoryMock.ts` | `src/Main/infrastructure/` | `src/Auth/infrastructure/` | Mock do repositório pertence ao domínio Auth. |
| `authMiddleware.ts` | `src/middleware/` | `src/Auth/infrastructure/` | Middleware de autenticação é um detalhe de infra do Auth. |

### 2.2 Subdomínio: Project (Renomeado de "Main")
Objetivo: Isolar a lógica central de gerenciamento de projetos.

| Arquivo/Pasta Atual | Diretório Atual | Novo Diretório | Motivo |
| :--- | :--- | :--- | :--- |
| `application/` | `src/Main/application/` | `src/Project/application/` | Organização consistente de domínios. |
| `infrastructure/` | `src/Main/infrastructure/` | `src/Project/infrastructure/` | Exceto os arquivos de Auth citados acima. |
| `module/Project.ts` | `src/Main/module/` | `src/Project/model/Project.ts` | "module" -> "model" para consistência. |
| `module/interfaces/` | `src/Main/module/` | `src/Project/model/interfaces/` | Centralizar interfaces do domínio. |

### 2.3 Subdomínio: Payment (Correção de Typo)
Objetivo: Corrigir o nome e garantir estrutura.

| Arquivo/Pasta Atual | Diretório Atual | Novo Diretório | Motivo |
| :--- | :--- | :--- | :--- |
| `PaymentGatway/` | `src/` | `src/Payment/` | Correção ortográfica (Gatway -> Gateway) e simplificação. |

### 2.4 Shared / Global
Objetivo: Componentes que cruzam fronteiras de domínio.

| Arquivo Atual | Diretório Atual | Novo Diretório | Motivo |
| :--- | :--- | :--- | :--- |
| `db.ts` | `src/` | `src/Shared/infrastructure/db.ts` | Configuração de banco de dados é infra compartilhada. |

## 3. Ajustes de Importação Necessários

A migração exigirá a atualização de todos os imports que utilizam caminhos relativos ou aliases.

1. **AuthContext.tsx**: Deve importar `AuthRepositoryMock` de `../../Auth/infrastructure/`.
2. **index.ts**: Deve importar os UseCases de `src/Project/application/` e Repositories de `src/Project/infrastructure/`.
3. **Middleware**: Referências ao `authenticate` no `index.ts` devem apontar para o novo local em `src/Auth/infrastructure/`.

## 4. Próximos Passos Sugeridos

1. Criar os novos diretórios (`src/Project`, `src/Shared`, `src/Payment`).
2. Mover os arquivos conforme a tabela acima.
3. Corrigir os imports em toda a aplicação.
4. Remover o diretório `src/Main` após a migração.
5. Renomear `src/PaymentGatway` para `src/Payment`.
