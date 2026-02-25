# Especificação Técnica: Gestão de Fases por Identificadores e Criação Explícita

## 1. Problema Identificado
O projeto sofre de inconsistências entre fases sugeridas e fases reais. Atualmente:
- O sistema pré-popula o banco com sugestões (Alpha, Beta, etc.) via `SyncPhasesUseCase`.
- O `TransitionPhaseUseCase` usa nomes (strings) em vez de IDs, o que é inseguro e ambíguo.
- Existe confusão entre "avançar o projeto para uma nova fase" (criação) e "navegar entre as fases para ver tarefas" (filtro).

## 2. Diagnóstico Técnico
- **Esquema de Dados**: `projects.current_phase` é TEXT, dificultando a integridade. Deve ser `current_phase_id` (FK para `phases.id`).
- **UseCases**:
    - `SyncPhasesUseCase`: Cria fases "fantasma" que o usuário ainda não atingiu. **Deve ser removido.**
    - `TransitionPhaseUseCase`: Nome enganador. Ele deve ser responsável por **criar** a próxima fase na jornada do projeto.
- **Navegação**: O Kanban deve apenas filtrar tarefas usando a lista de fases reais do `ProjectContext`.

## 3. Mudanças Propostas

### 3.1. Banco de Dados (Migrations em `src/db.ts`)
- Alterar a tabela `projects`: remover/ignorar `current_phase` e adicionar `current_phase_id` (INTEGER).
- Atualizar o bootstrap/migração para vincular os projetos às suas fases iniciais corretamente por ID.

### 3.2. Refatoração de UseCases

#### 3.2.1. Eliminar `SyncPhasesUseCase`
- Remover este UseCase. O sistema não deve criar fases que o usuário não solicitou.

#### 3.2.2. Renomear `TransitionPhaseUseCase` para `CreatePhaseUseCase`
- **Função**: Criar uma nova fase no banco de dados para o projeto e atualizar o `current_phase_id` do projeto.
- **Entrada**: `projectId`, `phaseName`, `tasks` (opcional).
- **Lógica**: 
    1. Insere nova fase em `phases`.
    2. Atualiza `projects.current_phase_id` com o novo ID.
    3. Associa tarefas à nova fase.

#### 3.2.3. Ajustar `AddProjectUseCase` e `ImportTasksUseCase`
- Devem criar o projeto e, imediatamente, criar a **primeira fase** na tabela `phases`.
- Configurar o `current_phase_id` do projeto para o ID desta primeira fase.

### 3.3. Frontend e API

#### 3.3.1. `ProjectContext.tsx`
- Atualizar para lidar com `current_phase_id`.
- Garantir que `fetchPhases` traga apenas o que está no banco.
- O método `transitionPhase` no contexto deve ser renomeado e ajustado para chamar o endpoint da API de **criação** de fase corrigido quando o usuário avançar o projeto.

#### 3.3.2. `KanbanBoard.tsx`
- A navegação deve ser estritamente baseada no ID da fase.
- Remover qualquer lógica que dependa de nomes para encontrar a fase atual.
- O filtro de tarefas (`filteredTasks`) deve usar `task.phase_id === selectedPhaseId`.

#### 3.3.3. API (Rotas em `src/index.ts`)
- Renomear endpoint `/api/projects/:id/transition` para algo que reflita a criação de fase.
- Validar se o `phase_id` fornecido em rotas de navegação existe.

## 4. Plano de Verificação
1. **Banco de Dados**: Após criar um projeto, verificar se apenas 1 fase existe na tabela `phases`.
2. **Navegação**: Abrir o Kanban e confirmar que apenas a fase inicial aparece no seletor.
3. **Avanço**: Usar o botão "Próxima Fase", definir um nome novo e confirmar que:
    - Uma nova fase foi criada no banco.
    - O Kanban agora mostra duas fases para navegação.
    - O ID da fase atual do projeto mudou.
