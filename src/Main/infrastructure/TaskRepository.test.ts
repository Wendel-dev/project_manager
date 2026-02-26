import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import db from "../../db";
import { TaskRepository } from "./TaskRepository";

describe("TaskRepository Integration", () => {
  const taskRepo = new TaskRepository();

  beforeAll(() => {
    // Cleanup first just in case
    db.query("DELETE FROM phases WHERE id = 999").run();
    db.query("DELETE FROM projects WHERE id = 999").run();

    // Setup test data
    db.query("INSERT INTO projects (id, user_id, name, type, current_phase_id, current_phase) VALUES (999, 'user-test', 'Test Project', 'jogo', 999, 'LEGACY')").run();
    db.query("INSERT INTO phases (id, user_id, project_id, name, order_index) VALUES (999, 'user-test', 999, 'Concepção', 0)").run();
  });

  afterAll(() => {
    // Cleanup test data
    db.query("DELETE FROM phases WHERE project_id = 999").run();
    db.query("DELETE FROM tasks WHERE project_id = 999").run();
    db.query("DELETE FROM projects WHERE id = 999").run();
  });

  it("should delete task correctly", async () => {
    // 1. Create task
    const taskId = db.query(
      "INSERT INTO tasks (user_id, project_id, title, area, status) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).get('user-test', 999, 'Task to Delete', 'Programação', 'todo') as { id: number };

    // 2. Verify task exists
    const before = db.query("SELECT * FROM tasks WHERE id = ?").get(taskId.id);
    expect(before).toBeDefined();

    // 3. Delete task
    await taskRepo.delete('user-test', taskId.id);

    // 4. Verify task is gone
    const after = db.query("SELECT * FROM tasks WHERE id = ?").get(taskId.id);
    expect(after).toBeNull();
  });

  it("should not delete task belonging to another user", async () => {
    // 1. Create task for 'user-test'
    const taskId = db.query(
      "INSERT INTO tasks (user_id, project_id, title, area, status) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).get('user-test', 999, 'Task not to Delete', 'Programação', 'todo') as { id: number };

    // 2. Try to delete as 'another-user'
    await taskRepo.delete('another-user', taskId.id);

    // 3. Verify task still exists
    const after = db.query("SELECT * FROM tasks WHERE id = ?").get(taskId.id);
    expect(after).toBeDefined();
    
    // Cleanup
    db.query("DELETE FROM tasks WHERE id = ?").run(taskId.id);
  });
});
