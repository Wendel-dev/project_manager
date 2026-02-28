# Especificação de Refatoração: Camada de Comunicação UI-API

## 1. Objetivo
Desvincular a comunicação de rede do frontend das interfaces de domínio e centralizar as chamadas de API em serviços específicos dentro da camada de UI. Isso visa simplificar o `ProjectContext`, remover código redundante e organizar as chamadas por entidade.

## 2. Nova Estrutura de Diretórios
Os arquivos de comunicação serão movidos para:
`src/UI/infrastructure/`

## 3. Definição dos Serviços de API

Cada serviço será uma classe ou conjunto de funções que lida exclusivamente com o `fetch` para os endpoints correspondentes. Eles **não** implementarão as interfaces de `src/Project/application/interfaces/`.

### 3.1 `ProjectApiService.ts`
Responsável pelo gerenciamento de projetos.
- `findAll()`: GET `/api/projects`
- `findById(id)`: GET `/api/projects/:id`
- `create(data)`: POST `/api/projects`
- `update(id, data)`: PATCH `/api/projects/:id`
- `delete(id)`: DELETE `/api/projects/:id`

### 3.2 `TaskApiService.ts`
Responsável pelo gerenciamento de tarefas.
- `findByProject(projectId)`: GET `/api/projects/:projectId/tasks`
- `create(projectId, data)`: POST `/api/projects/:projectId/tasks`
- `update(taskId, data)`: PATCH `/api/tasks/:taskId`
- `delete(taskId)`: DELETE `/api/tasks/:taskId`

### 3.3 `PhaseApiService.ts`
Responsável pelas fases do projeto.
- `findByProject(projectId)`: GET `/api/projects/:projectId/phases`
- `create(projectId, data)`: POST `/api/projects/:projectId/phases` (Transição de fase)

### 3.4 `DocApiService.ts`
Responsável pela documentação e hierarquia.
- `getTree(projectId)`: GET `/api/projects/:projectId/docs`
- `save(projectId, data)`: POST `/api/projects/:projectId/docs`
- `importHierarchy(projectId, sections)`: POST `/api/projects/:projectId/import-docs`

### 3.5 `ParsingApiService.ts`
Responsável pelo processamento de arquivos (Uploads).
- `parseProjectFile(file)`: POST `/api/parse-document`
- `parseDocHierarchy(file)`: POST `/api/parse-doc-hierarchy`
- `importProject(data)`: POST `/api/import-project`

### 3.6 `GovernanceApiService.ts`
- `getReport(projectId)`: GET `/api/projects/:projectId/governance`

## 4. Plano de Execução

1.  **Criação do Diretório:** Criar `src/UI/infrastructure/`.
2.  **Implementação dos Serviços:** Criar cada um dos arquivos `.ts` listados acima, extraindo a lógica de `fetch` e tratamento de erros do `ProjectContext.tsx` e do antigo `ProjectRepositoryAPI.ts`.
3.  **Refatoração do `ProjectContext.tsx`:**
    - Remover todas as chamadas `fetch` diretas.
    - Instanciar os novos serviços no topo do Provider (ou usá-los como singletons).
    - Substituir a lógica interna das funções (ex: `addProject`, `addTask`) por chamadas aos novos serviços.
4.  **Limpeza:**
    - Excluir `src/Project/infrastructure/ProjectRepositoryAPI.ts`.
    - Remover referências a UseCases que estavam sendo instanciados no frontend (exceto os de exportação pura de dados se necessário).

## 5. Premissas Técnicas
- **Validação:** Toda a lógica de negócio e validação reside no Backend (API). O frontend apenas envia os dados e reage às respostas (sucesso/erro).
- **Tipagem:** Utilizar as interfaces de `src/Project/module/interfaces/` apenas para tipar os retornos e payloads, sem obrigatoriedade de seguir contratos de repositório.
- **Headers:** Centralizar a lógica de autenticação (tokens/sessão) em um utilitário comum dentro de `UI/infrastructure`.
