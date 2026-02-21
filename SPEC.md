# Especificação Técnica: Documentação Hierárquica e Parsing Avançado

## 1. Visão Geral
O objetivo é transformar o sistema de documentação simples em uma estrutura hierárquica e recursiva. A aplicação permitirá o upload de documentos (MD, TXT, PDF), realizando o parse automático de seções baseadas em títulos/cabeçalhos e organizando-as em uma estrutura de árvore.

## 2. Requisitos Funcionais
- **Importação de Documentos:** Suporte a arquivos `.md`, `.txt` e `.pdf`.
- **Parsing Hierárquico:** 
    - No Markdown, os níveis de heading (`#`, `##`, `###`, etc.) definirão a hierarquia.
    - No PDF/TXT, padrões de títulos serão identificados para criar seções.
- **Navegação Recursiva:**
    - Barra lateral com índice em árvore (dropdown/nested list).
    - Ao selecionar um elemento pai, o sistema deve renderizar o seu conteúdo e, recursivamente, o conteúdo de todos os seus filhos.
- **Gerenciamento Manual:**
    - Ao criar um novo elemento manualmente, o usuário poderá selecionar um "Elemento Pai".
    - Se nenhum pai for selecionado, ele será um elemento raiz.
- **Interface de Edição:** Manter o suporte a versionamento já existente.

## 3. Arquitetura e Dados

### 3.1 Alterações no Banco de Dados (SQLite)
Tabela `doc_elements`:
- Adicionar coluna `parent_id INTEGER` (chave estrangeira para `doc_elements.id`).

### 3.2 Novos Modelos e Interfaces
```typescript
// src/module/interfaces/Doc.ts
export interface DocElementData {
  id: number;
  user_id: string;
  project_id: number;
  title: string;
  parent_id: number | null; // Nova coluna
  current_version_id: number | null;
  current_content?: string;
  version_created_at?: string;
}

// Interface para o resultado do parsing
export interface ParsedDocSection {
  title: string;
  content: string;
  children: ParsedDocSection[];
}
```

### 3.3 Camada de Infraestrutura (Novos Parsers de Documentação)
Para não interferir nos parsers existentes (que focam em extrair tarefas e fases), criaremos uma nova interface e implementações:
- **IDocParser (Nova Interface):** Definirá o contrato `parse(content: string | Buffer): Promise<ParsedDocSection[]>`.
- **DocMarkdownParser:** Focará exclusivamente na hierarquia de cabeçalhos (`#` a `######`) para gerar a árvore de seções.
- **DocPDFParser / DocTextParser:** Novos parsers que identificarão quebras de seção e títulos para a árvore de documentação.

### 3.4 Camada de Aplicação (Novos Use Cases)
- **ParseDocDocumentUseCase:** Novo use case para gerenciar o upload e parsing de arquivos de documentação.
- **ImportDocUseCase:** Recebe a árvore `ParsedDocSection[]` e realiza a persistência recursiva no banco.
- **GetDocTreeUseCase:** Recuperar a estrutura de documentos já organizada em árvore para o frontend.

## 4. Design da Interface (Frontend)

### 4.1 DocSidebar (Navegação)
- Componente recursivo que renderiza a árvore de documentos.
- Suporte a expandir/recolher níveis.

### 4.2 DocViewer (Visualização)
- Ao clicar em um nó:
    1. Renderiza o título e conteúdo do nó atual.
    2. Abaixo, renderiza recursivamente os filhos (Título do filho + Conteúdo do filho).
    3. Estilização visual para diferenciar níveis de indentação ou usar cards aninhados.

### 4.3 DocForm (Edição/Criação)
- Campo `select` para escolher o `parent_id` entre os documentos existentes do projeto.
- Área de Drag & Drop para upload de arquivos.

## 5. Plano de Implementação

1.  **Migração:** Adicionar `parent_id` ao banco de dados e atualizar tipos TS.
2.  **Refatoração de Parsers:** Alterar a lógica de parsing para suportar a estrutura aninhada de `ParsedDocSection`.
3.  **Backend:** Atualizar Repositórios e criar/ajustar endpoints para suportar a hierarquia.
4.  **Frontend (Contexto):** Atualizar o `ProjectContext` para carregar e organizar os documentos em árvore.
5.  **Frontend (Componentes):** Criar os componentes `DocTree`, `DocSectionViewer` e atualizar o `DocEditor`.
6.  **Testes:** Validar o parsing de documentos complexos e a renderização recursiva.
