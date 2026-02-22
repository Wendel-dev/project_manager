# Especificação: Modal de Detalhes da Tarefa

## Objetivo
Implementar uma janela modal que permita aos usuários visualizar e editar todas as informações de uma tarefa, incluindo descrição, data de término e lista de verificação (subtarefas), indo além da visualização básica atual no quadro Kanban.

## Histórias de Usuário
- **Como usuário**, quero clicar em um card de tarefa no Kanban para abrir seus detalhes.
- **Como usuário**, quero ver a descrição completa da tarefa para entender o que precisa ser feito.
- **Como usuário**, quero ver e gerenciar uma lista de subtarefas (checklist) para acompanhar o progresso.
- **Como usuário**, quero visualizar a data de entrega da tarefa para me planejar.
- **Como usuário**, quero poder editar essas informações diretamente na modal.

## Requisitos Funcionais

### 1. Visualização de Detalhes
- Exibir o título da tarefa.
- Exibir a área da tarefa (Arte, Programação, etc.).
- Exibir a descrição completa.
- Exibir a data de término (`target_date`), se houver.
- Exibir a lista de checklists/subtarefas.

### 2. Interação
- Clicar em um card de tarefa no `KanbanBoard` deve abrir a modal.
- A modal deve ter um botão de fechamento (X) e fechar ao clicar fora dela.
- Permitir a edição dos campos (título, descrição, data de término).
- Permitir adicionar, marcar como concluído e remover itens da checklist.

### 3. Persistência
- As alterações devem ser salvas no backend usando a função `updateTask` do `ProjectContext`.

## Requisitos Técnicos

### Componentes
- `TaskDetailModal.tsx`: Novo componente para a modal.
- `KanbanBoard.tsx`: Atualizar para gerenciar o estado da tarefa selecionada e abrir a modal.

### Dados
- Atualizar a interface `Task` no `ProjectContext.tsx` para incluir `target_date` e `checklists`.
- Tratar `checklists` como uma estrutura JSON (ex: `Array<{text: string, completed: boolean}>`) que será armazenada como string no banco de dados.

## Plano de Implementação

1.  **Ajuste de Tipos**: Atualizar `src/contexts/ProjectContext.tsx` para incluir os campos faltantes na interface `Task`.
2.  **Criação do Componente**: Desenvolver `src/components/TaskDetailModal.tsx` com suporte a exibição e edição.
3.  **Integração no Kanban**: Adicionar estado `selectedTask` no `KanbanBoard.tsx` e lógica para abrir/fechar a modal.
4.  **Estilização**: Adicionar estilos necessários em `src/styles/main.css` ou arquivo específico.
5.  **Testes**: Verificar se as atualizações são refletidas corretamente no Kanban após fechar a modal.

## Design Sugerido (UX)
- **Overlay**: Fundo escurecido semi-transparente.
- **Container**: Centralizado, com largura máxima de 600px, fundo branco e bordas arredondadas.
- **Seções**:
    - Cabeçalho: Título e Área.
    - Corpo: Descrição (Textarea), Data (Input date), Checklist (Lista de itens com checkbox).
    - Rodapé: Botões de Salvar/Fechar.
