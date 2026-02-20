# Especificação Técnica (SPEC): Sistema de Parse de Documentos

Esta especificação detalha a implementação técnica da funcionalidade de importação de projetos e tarefas a partir de documentos, baseada no [PRD_Document_Parsing.md](PRD_Document_Parsing.md).

---

## 1. Arquitetura e Estrutura de Pastas

A implementação seguirá a arquitetura limpa (Clean Architecture) já presente no projeto.

### 1.1 Novos Módulos e Interfaces (`src/module`)
- **`src/module/interfaces/ParsedProject.ts`**: Define a estrutura de dados retornada pelos parsers.
  ```typescript
  export interface ParsedTask {
    title: string;
    area?: string;
    description: string;
    targetDate?: string;
    checklists: string[]; // Itens de checklist (- [ ] ou - [x])
  }

  export interface ParsedProject {
    name: string;
    type: string; // Etapa/Fase inicial sugerida
    tasks: ParsedTask[];
  }
  ```

### 1.2 Camada de Aplicação (`src/application`)
- **`ParseDocumentUseCase.ts`**: Coordena o processo de parsing usando o padrão Strategy.
- **`ImportTasksUseCase.ts`**: Recebe a estrutura parseada e realiza o salvamento em lote (bulk insert).

### 1.3 Camada de Infraestrutura (`src/infrastructure`)
- **`parsers/IDocumentParser.ts`**: Interface comum para todos os parsers.
- **`parsers/MarkdownParser.ts`**: Implementação principal usando `unified` e `remark-parse`.
- **`parsers/PDFParser.ts`**: Extração de texto via `pdf-parse`.
- **`parsers/TextParser.ts`**: Fallback para arquivos de texto simples.

---

## 2. Detalhes de Implementação

### 2.1 Padrão Strategy (Parsers)
O `ParseDocumentUseCase` selecionará o parser adequado com base na extensão do arquivo ou MIME type.

### 2.2 Mapeamento Markdown (AST)
Utilizar `unified` e `remark-parse` para navegar na AST:
- `# (h1)`: Nome do Projeto.
- `## (h2)`: Atribuição de "Área" para as tarefas seguintes.
- `### (h3)`: Título da Tarefa.
- `Parágrafo`: Descrição da Tarefa.
- `List Item (checklist)`: Adicionado ao array de checklists da tarefa atual.
- `Tag @targetDate`: Regex `/@targetDate\s+(\d{4}-\d{2}-\d{2})/` para extração de data.

### 2.3 Preview e Validação
Antes do salvamento final, o frontend deve exibir um preview:
- Utilizar `zod` no backend/use-case para validar os campos obrigatórios.
- Permitir edição manual no preview antes da confirmação.

---

## 3. Requisitos de Testes Automáticos

Cada nova funcionalidade deve obrigatoriamente acompanhar testes automatizados utilizando `bun test`.

### 3.1 Testes de Parsers (Unitários)
- **`MarkdownParser.test.ts`**:
  - Testar mapeamento correto de H1, H2, H3 para Projeto, Área e Tarefa.
  - Validar extração de checklist (itens marcados e não marcados).
  - Validar extração de `@targetDate` em diferentes posições do texto.
  - Testar tratamento de Markdown malformado (ex: sem H1).
- **`PDFParser.test.ts`**:
  - Mockar o `pdf-parse` para garantir que o texto extraído é repassado corretamente ao parser de estrutura.
- **`TextParser.test.ts`**:
  - Validar parsing de texto simples linha a linha.

### 3.2 Testes de Casos de Uso (Integração)
- **`ParseDocumentUseCase.test.ts`**:
  - Validar seleção automática de parser baseada no tipo de entrada.
  - Validar integração com o `AuthContext` (associação ao `user_id`).
- **`ImportTasksUseCase.test.ts`**:
  - Validar transação atômica no banco de dados (bulk insert).
  - Garantir que se uma tarefa falhar, nenhuma seja inserida (rollback/idempotência).
  - Testar detecção de duplicidade de tarefas.

### 3.3 Testes de UI (Componentes/Frontend)
- **`FileUpload.test.tsx`**:
  - Testar drag-and-drop de arquivos.
  - Validar limite de tamanho de arquivo.
- **`ImportPreview.test.tsx`**:
  - Validar exibição correta dos dados parseados.
  - Testar edição de campos no preview antes da submissão.

---

## 4. Dependências Necessárias
- `unified`, `remark-parse`, `remark-stringify` (Markdown AST)
- `pdf-parse` (Extração PDF)
- `zod` (Validação de Schema)
- `@types/pdf-parse` (Tipagens)

---

## 5. Fluxo de Trabalho Sugerido
1. Adicionar dependências ao `package.json`.
2. Implementar interfaces e tipos no `src/module`.
3. Implementar `MarkdownParser` e seus testes unitários.
4. Implementar `ParseDocumentUseCase` e testes de integração.
5. Criar UI de Upload e Preview no frontend.
6. Integrar com repositórios existentes para salvar tarefas.
