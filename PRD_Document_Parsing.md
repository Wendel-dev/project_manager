# Product Requirements Document (PRD): Sistema de Parse de Documentos para Tarefas

## 1. Visão Geral
O objetivo é permitir que os usuários criem projetos e tarefas em massa através do upload ou colagem de documentos formatados em Markdown (.md, .txt) ou outros formatos suportados (PDF). O sistema deve converter a estrutura hierárquica do Markdown em entidades do sistema (Projetos, Áreas e Tarefas).

## 2. Requisitos Funcionais

| ID | Funcionalidade | Descrição |
|---|---|---|
| RF01 | Suporte a Múltiplos Formatos | O sistema deve aceitar arquivos `.md`, `.txt` e `.pdf`. |
| RF02 | Identificação de Estrutura | O parser deve mapear headers Markdown para entidades: <br> - `# Header 1` -> Nome da etapa <br> - `## Header 2` -> Área da Tarefa <br> - `### Header 3` -> Título da Tarefa <br> - Texto comum -> Descrição da Tarefa |
| RF03 | Reconhecimento de Checklist | Linhas iniciadas com `- [ ]` ou `- [x]` devem ser convertidas em check lists dentro das tarefas individuais. |
| RF04 | Reconhecimento de tags | Ao incluir `@targetDate` na descrição de uma tarefa deve ser verificado se o proximo elemento é uma data válida, yyyy-mm-dd, caso positivo deve ser adicionado a data como data de conclusão. |
| RF05 | Preview de Importação | Antes de salvar no banco de dados, o usuário deve visualizar uma lista das tarefas que serão criadas. |
| RF06 | Atribuição de Usuário | Todas as tarefas importadas devem ser associadas ao `user_id` da sessão atual. |
| RF07 | Validação de Formato | O sistema deve validar se o arquivo enviado segue o padrão esperado e informar erros de formatação. |
| RF08 | Alteração de implementação | O sistema atual reconhece as etapas e areas como fixas, para flexibilizar vamos permitir que o programa reconheça os nomes das equipes, nome da etapa, etc conforme o descrito pelo usuário, não tendo os valores fixos, más mantendo os fixos para sugestões. |

## 3. Arquitetura Técnica Sugerida

### 3.1 Camada de Parser (Strategy Pattern)
Utilizar o padrão Strategy para lidar com diferentes formatos de entrada:
- `MarkdownParser`: Processa strings Markdown diretamente.
- `PDFParser`: Extrai o texto do PDF e o converte/trata como Markdown.
- `TextParser`: Trata texto puro linha a linha.

### 3.2 Bibliotecas Recomendadas
- **Markdown (AST):** [`remark`](https://remark.js.org/) ou [`unified`](https://unifiedjs.com/) para gerar uma AST (Abstract Syntax Tree). 
  - **Vantagem:** O parsing baseado em AST permite navegar pela árvore de nós (`heading`, `paragraph`, `list`) de forma programática, garantindo que o mapeamento de níveis (`depth: 1` -> Projeto, `depth: 2` -> Área) seja preciso e ignore blocos de código ou citações que poderiam confundir um parser simples de regex.
- **Markdown (Simples):** [`marked`](https://www.npmjs.com/package/marked) para uma implementação rápida se a estrutura for estritamente linear.
- **PDF:** [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) para extração de texto no Node.js/Bun.
- **Validação:** [`zod`](https://zod.dev/) para garantir que os dados extraídos possuam os campos obrigatórios (`title`, `area`, `project_id`).

## 4. Melhores Práticas de Implementação

### 4.1 Processamento em Lote (Bulk Insert)
Para evitar múltiplas idas ao banco de dados, o repositório deve suportar a criação de várias tarefas em uma única transação SQL.

### 4.2 Sanitização e Segurança
- Validar se o conteúdo do arquivo não contém scripts maliciosos.
- Limitar o tamanho do arquivo para evitar ataques de DoS (Denial of Service).

### 4.3 Feedback ao Usuário
- Exibir uma barra de progresso durante o parse de arquivos grandes.
- Mostrar logs de sucesso/erro detalhados (ex: "Linha 45: Título de tarefa não encontrado").

### 4.4 Idempotência
Verificar se tarefas com o mesmo título já existem no projeto para evitar duplicidade em caso de re-upload.

## 5. Próximos Passos
1. Implementar o `ParseUseCase` que coordena a leitura do arquivo e a chamada aos repositórios.
2. Criar o componente de UI `FileUpload` com área de drag-and-drop.
3. Integrar com o `AddProjectUseCase` e `AddTaskUseCase` existentes.
