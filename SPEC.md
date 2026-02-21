# Especificação Técnica: Excluir Projeto

## 1. Visão Geral
O objetivo é implementar a funcionalidade de exclusão de um projeto no sistema. Esta operação deve ser segura, exigindo confirmação do usuário, e deve garantir a integridade do banco de dados ao remover todas as dependências associadas (tarefas, documentos e versões).

## 2. Requisitos Funcionais
- **Botão de Exclusão:** Disponibilizar uma opção de "Excluir Projeto" na interface (ex: Dashboard ou Sidebar).
- **Confirmação:** Exibir um modal ou alerta de confirmação antes de proceder com a exclusão.
- **Remoção Completa:** Excluir o projeto e todos os seus dados relacionados (Tarefas, Elementos de Documentação e Versões de Documentos).
- **Atualização de Estado:** Após a exclusão, a lista de projetos deve ser atualizada e o projeto selecionado deve ser limpo.

## 3. Detalhes Técnicos

### 3.1 Banco de Dados (SQLite)
Como o schema atual não utiliza `ON DELETE CASCADE`, a exclusão deve ser feita de forma manual e ordenada no repositório para evitar órfãos:
1. `doc_element_versions` (via JOIN com `doc_elements`)
2. `doc_elements`
3. `tasks`
4. `projects`

### 3.2 Alterações na API
- **Nova Rota:** `DELETE /api/projects/:id`
- **Middleware:** Deve ser uma rota protegida (requer autenticação).

### 3.3 Componentes de Software
- **IProjectRepository:** Adicionar método `delete(userId: string, id: number)`.
- **DeleteProjectUseCase:** Novo caso de uso para gerenciar a lógica de exclusão.
- **ProjectContext:** Adicionar função `deleteProject(id: number)` para integração com o frontend.

## 4. Plano de Implementação Passo a Passo

### Passo 1: Camada de Domínio e Infraestrutura
1.  Atualizar `src/application/interfaces/IProjectRepository.ts` com o método `delete`.
2.  Implementar o método `delete` em `src/infrastructure/ProjectRepository.ts`.
    - *Nota: Realizar as deleções em ordem reversa de dependência.*

### Passo 2: Camada de Aplicação
1.  Criar `src/application/DeleteProjectUseCase.ts`.
2.  Instanciar e configurar o use case em `src/index.ts`.

### Passo 3: API (Backend)
1.  Adicionar o endpoint `DELETE /api/projects/:id` em `src/index.ts`.
2.  Testar a rota com um cliente HTTP ou script simples.

### Passo 4: Frontend (Contexto e UI)
1.  Atualizar `src/contexts/ProjectContext.tsx` para incluir a lógica de chamada à API de exclusão.
2.  Adicionar um botão de exclusão no componente `src/components/ProjectDashboard.tsx` ou `src/components/Sidebar.tsx`.
3.  Implementar o `window.confirm` ou um modal customizado para confirmação.

## 5. Critérios de Aceite
- [ ] O projeto é removido da lista lateral após a exclusão.
- [ ] Todas as tarefas associadas ao projeto são removidas do banco de dados.
- [ ] Todos os documentos e suas versões associadas são removidos do banco de dados.
- [ ] Não é possível excluir um projeto que não pertence ao usuário logado.
