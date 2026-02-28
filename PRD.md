# PRD - Implementação Profissional MySQL (Native Driver)

Este documento detalha a migração para MySQL utilizando o driver nativo `mysql2`, priorizando performance máxima e controle total sobre as consultas SQL.

---

## 1. Objetivos
- **Performance de Metal:** Zero overhead de abstração ao usar consultas SQL puras.
- **Escalabilidade:** Utilização de pooling para gerenciar centenas de conexões simultâneas.
- **Segurança:** Proteção rigorosa contra SQL Injection via Prepared Statements.

## 2. Configuração do Driver (Eficiência Máxima)

Diferente do SQLite (arquivo único), o MySQL em servidor exige **Connection Pooling**. Criar uma conexão por request destruiria a performance.

### 2.1 Connection Pooling
Deve-se usar `mysql2/promise` para suporte nativo a `async/await`.
- **Configuração Recomendada:**
  - `connectionLimit`: Entre 10 e 50 (dependendo da RAM do servidor).
  - `waitForConnections`: `true`.
  - `enableKeepAlive`: `true` (evita que o MySQL derrube conexões ociosas).

## 3. Segurança (Critical)

### 3.1 Prepared Statements (Obrigatório)
**Nunca** use concatenação de strings. O `mysql2` lida com isso de forma eficiente:
```typescript
// Seguro e Rápido (O MySQL faz cache do plano de execução)
const [rows] = await pool.execute('SELECT * FROM tasks WHERE user_id = ?', [userId]);
```

### 3.2 Variáveis de Ambiente
Utilizar um arquivo `.env` para:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SSL_CA` (Caminho para o certificado se o servidor exigir SSL, ex: AWS/DigitalOcean).

## 4. Diferenças de Sintaxe (SQLite vs MySQL)

Suas queries atuais em `src/db.ts` precisarão de pequenos ajustes para o MySQL:

| Recurso | SQLite | MySQL |
| :--- | :--- | :--- |
| **ID Auto Incremento** | `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT AUTO_INCREMENT PRIMARY KEY` |
| **Data Atual** | `DATETIME DEFAULT CURRENT_TIMESTAMP` | `DATETIME DEFAULT CURRENT_TIMESTAMP` |
| **Booleans** | `INTEGER` (0 ou 1) | `TINYINT(1)` |
| **Foreign Keys** | Ativadas por PRAGMA | Nativas (InnoDB) |
| **Upsert** | `INSERT OR REPLACE` | `INSERT ... ON DUPLICATE KEY UPDATE` |

## 5. Tipagem no TypeScript (Sem ORM)

Para manter o projeto profissional, definiremos interfaces para os resultados das queries:

```typescript
import { RowDataPacket } from 'mysql2';

interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  status: string;
}

const [tasks] = await pool.execute<TaskRow[]>('SELECT * FROM tasks');
// tasks[0].title -> Tipagem garantida aqui
```

## 6. Plano de Ação

1.  **Instalação:**
    ```bash
    bun add mysql2
    ```
2.  **Criação do Pool (`src/infrastructure/MySQLConnection.ts`):** Centralizar a instância do pool.
3.  **Refatoração dos Repositórios:** Substituir as chamadas de `db.run` e `db.query` (SQLite) por `pool.execute` (MySQL).
4.  **Schema Migration:** Criar um script SQL puro (`schema.sql`) para inicializar o banco no servidor.

## 7. Referências Técnicas

- **Performance Benchmarks:** [mysql2 vs others](https://github.com/sidorares/node-mysql2#benchmarks)
- **Documentação de Pooling:** [MySQL2 Pool Guide](https://github.com/sidorares/node-mysql2#using-connection-pools)
- **Guia de Segurança:** [MySQL Prepared Statements](https://dev.mysql.com/doc/refman/8.0/en/prepared-statements.html)

---
*Documento atualizado para foco em Performance Nativa em 27/02/2026.*
