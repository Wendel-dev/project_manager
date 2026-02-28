import { SQLiteProjectRepository } from "./persistence/SQLite/SQLiteProjectRepository";
import { SQLiteTaskRepository } from "./persistence/SQLite/SQLiteTaskRepository";
import { SQLitePhaseRepository } from "./persistence/SQLite/SQLitePhaseRepository";
import { SQLiteDocRepository } from "./persistence/SQLite/SQLiteDocRepository";
import { MySQLProjectRepository } from "./persistence/MySQL/MySQLProjectRepository";
import { MySQLTaskRepository } from "./persistence/MySQL/MySQLTaskRepository";
import { MySQLPhaseRepository } from "./persistence/MySQL/MySQLPhaseRepository";
import { MySQLDocRepository } from "./persistence/MySQL/MySQLDocRepository";
import type { IProjectRepository } from "../application/interfaces/IProjectRepository";
import type { ITaskRepository } from "../application/interfaces/ITaskRepository";
import type { IPhaseRepository } from "../application/interfaces/IPhaseRepository";
import type { IDocRepository } from "../application/interfaces/IDocRepository";

export class ProjectRepositoryFactory {
  static createProjectRepository(): IProjectRepository {
    const dbType = process.env.DB_TYPE;
    switch(dbType) {
      case 'mysql':
        return new MySQLProjectRepository();
      default: 
        return new SQLiteProjectRepository();
    }
  }

  static createTaskRepository(): ITaskRepository {
    const dbType = process.env.DB_TYPE;
    switch(dbType) {
      case 'mysql':
        return new MySQLTaskRepository();
      default: 
        return new SQLiteTaskRepository();
    }
  }

  static createPhaseRepository(): IPhaseRepository {
    const dbType = process.env.DB_TYPE;
    switch(dbType) {
      case 'mysql':
        return new MySQLPhaseRepository();
      default: 
        return new SQLitePhaseRepository();
    }
  }

  static createDocRepository(): IDocRepository {
    const dbType = process.env.DB_TYPE;
    switch(dbType) {
      case 'mysql':
        return new MySQLDocRepository();
      default: 
        return new SQLiteDocRepository();
    }
  }
}
