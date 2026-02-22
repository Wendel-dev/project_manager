# Especificação Técnica: Correção da Renderização de Subtarefas (Checklists)

## Problema
Ocorria um erro de parsing de JSON ao tentar renderizar subtarefas (checklists) de uma tarefa no `TaskDetailModal.tsx`. O erro era causado pela inconsistência no formato em que os checklists eram salvos no banco de dados: alguns lugares salvavam como string separada por nova linha (`
`), enquanto o frontend esperava uma string JSON de objetos `ChecklistItem`.

## Mudanças Necessárias

### 1. Definir `ChecklistItem` de forma global no Domínio
Remover a definição de `ChecklistItem` de `src/contexts/ProjectContext.tsx` e movê-la para `src/module/interfaces/Task.ts` para que possa ser usada tanto no frontend quanto nas camadas de aplicação e infraestrutura.

**Arquivo:** `src/module/interfaces/Task.ts`
```typescript
export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface TaskData {
  // ... campos existentes ...
  checklists?: string | null; // Deve ser sempre uma string JSON de ChecklistItem[]
}
```

### 2. Atualizar Interface `ParsedTask`
Alterar o tipo de `checklists` de `string[]` para `ChecklistItem[]`.

**Arquivo:** `src/module/interfaces/ParsedProject.ts`
```typescript
import { ChecklistItem } from './Task';

export interface ParsedTask {
  title: string;
  area?: string;
  description: string;
  targetDate?: string;
  checklists: ChecklistItem[]; // Alterado de string[] para ChecklistItem[]
}
```

### 3. Atualizar os Parsers (Markdown e Text)
Os parsers devem agora criar objetos `ChecklistItem`.

**Arquivo:** `src/infrastructure/parsers/MarkdownParser.ts`
```typescript
// ... dentro do loop de lista ...
const isCompleted = item.checked === true;
const itemText = this.extractTargetDate(this.toString(item), currentTask);
currentTask.checklists.push({
  text: itemText.replace(/^\[[ x]\]\s*/, '').trim(),
  completed: isCompleted
});
```

**Arquivo:** `src/infrastructure/parsers/TextParser.ts`
```typescript
// ... dentro da condição de lista ...
const isCompleted = line.startsWith('- [x] ');
const itemText = line.replace(/^- (\[[ x]\] )?/, '').trim();
currentTask.checklists.push({
  text: itemText,
  completed: isCompleted
});
```

### 4. Atualizar os Casos de Uso (Application Layer)
Garantir que ao criar/atualizar tarefas, os checklists sejam salvos como JSON.

**Arquivos:** `src/application/AddProjectUseCase.ts`, `src/application/TransitionPhaseUseCase.ts`, `src/application/ImportTasksUseCase.ts`
```typescript
// De:
checklists: task.checklists && task.checklists.length > 0 ? task.checklists.join('
') : null,

// Para:
checklists: task.checklists && task.checklists.length > 0 ? JSON.stringify(task.checklists) : null,
```

### 5. Robustez no Frontend (`TaskDetailModal.tsx`)
Atualizar o parsing para ser resiliente a dados legados (strings separadas por `
`).

**Arquivo:** `src/components/TaskDetailModal.tsx`
```typescript
  const checklists: ChecklistItem[] = (() => {
    if (!editedTask.checklists) return [];
    try {
      const parsed = JSON.parse(editedTask.checklists);
      if (Array.isArray(parsed)) {
        // Suporte a legado: se for array de strings, converter
        if (typeof parsed[0] === 'string') {
          return (parsed as string[]).map(s => ({
            text: s.replace(/^\[[ x]\]\s*/, '').trim(),
            completed: s.startsWith('[x]')
          }));
        }
        return parsed;
      }
      return [];
    } catch (e) {
      // Fallback para formato de nova linha (legado antigo)
      return editedTask.checklists.split('
').map(line => ({
        text: line.replace(/^\[[ x]\]\s*/, '').trim(),
        completed: line.startsWith('[x]')
      })).filter(item => item.text.length > 0);
    }
  })();
```

## Validação
1. Importar um novo projeto via Markdown/Text.
2. Abrir uma tarefa e verificar se os checklists aparecem.
3. Marcar/desmarcar itens do checklist e salvar.
4. Reabrir e verificar se o estado foi mantido.
