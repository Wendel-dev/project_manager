# SPEC - Migração para MySQL (Native Driver) com Factory Pattern

Este documento especifica a refatoração da infraestrutura de dados para suportar múltiplos bancos de dados (SQLite e MySQL), utilizando o padrão **Factory** para isolar a lógica de persistência.

## 1. Nova Estrutura de Diretórios

Para evitar poluição e manter o projeto organizado, os repositórios serão movidos para diretórios de persistência específicos:

### 1.1 Módulo Project
- `src/Project/infrastructure/persistence/SQLite/`: Implementações atuais renomeadas.
- `src/Project/infrastructure/persistence/MySQL/`: Novas implementações utilizando `mysql2`.
- `src/Project/infrastructure/ProjectRepositoryFactory.ts`: Centraliza a criação dos repositórios do módulo.

### 1.2 Módulo Payment
- `src/Payment/infrastructure/persistence/SQLite/`
- `src/Payment/infrastructure/persistence/MySQL/`
- `src/Payment/infrastructure/PaymentRepositoryFactory.ts`

## 2. Implementação da Factory

A Factory decidirá qual implementação retornar com base na variável `DB_TYPE`.

```typescript
// Exemplo: src/Project/infrastructure/ProjectRepositoryFactory.ts
import { SQLiteProjectRepository } from "./persistence/SQLite/SQLiteProjectRepository";
import { MySQLProjectRepository } from "./persistence/MySQL/MySQLProjectRepository";

export class ProjectRepositoryFactory {
  static createProjectRepository(): IProjectRepository {
    const dbType = process.env.DB_TYPE || 'sqlite';
    return dbType === 'mysql' 
      ? new MySQLProjectRepository() 
      : new SQLiteProjectRepository();
  }
  // Repetir para Task, Phase, Doc...
}
```

## 3. Configuração do MySQL (Pool Nativo)

Criar `src/Shared/infrastructure/persistence/MySQLConnection.ts` para centralizar o pool de conexões.

```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  enableKeepAlive: true
});
```

## 4. Plano de Execução Detalhado

1.  **Instalação**: `bun add mysql2`.
2.  **Infraestrutura Compartilhada**: Criar `MySQLConnection.ts` em `Shared`.
3.  **Migração SQLite**: 
    - Criar diretórios `persistence/SQLite` em cada módulo.
    - Mover e renomear arquivos (ex: `ProjectRepository.ts` -> `SQLiteProjectRepository.ts`).
    - Ajustar os imports internos (apontando corretamente para `../../../../db`).
4.  **Implementação MySQL**:
    - Criar diretórios `persistence/MySQL`.
    - Implementar repositórios traduzindo queries SQLite para MySQL (Prepared Statements).
5.  **Criação das Factories**: Implementar as classes Factory em cada módulo.
6.  **Refatoração do `src/index.ts`**: Substituir a instanciação direta `new Repository()` pelas chamadas à Factory.
7.  **Schema SQL**: Criar `documentation/mysql-schema.sql` com todos os DDLs necessários.

## 5. Considerações Técnicas (Diferenças SQL)

- **Booleans**: No MySQL, usar `TINYINT(1)`.
- **IDs**: `AUTO_INCREMENT` vs `AUTOINCREMENT`.
- **JSON**: O campo `checklists` da tabela `tasks` deve ser do tipo `JSON` no MySQL para melhor performance de consulta, enquanto no SQLite é `TEXT`.
- **Dates**: Garantir compatibilidade com `ISOStrings` ou `DATETIME` nativo.
