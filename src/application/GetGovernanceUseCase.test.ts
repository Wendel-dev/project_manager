import { describe, it, expect, mock } from "bun:test";
import { GetGovernanceUseCase } from "./GetGovernanceUseCase";
import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { TaskData } from "../module/interfaces/Task";

describe("GetGovernanceUseCase", () => {
  it("should include the next task in the nextStep metadata based on area with most pending tasks", async () => {
    const tasks: Partial<TaskData>[] = [
      // Area: Frontend (2 todo)
      { id: 1, title: "Oldest Frontend", area: "Frontend", status: "todo", created_at: "2023-01-01T00:00:00Z", target_date: "2024-12-01T00:00:00Z" },
      { id: 2, title: "Closest Date Frontend", area: "Frontend", status: "todo", created_at: "2023-02-01T00:00:00Z", target_date: "2024-01-01T00:00:00Z" },
      { id: 3, title: "Newer with same date", area: "Frontend", status: "todo", created_at: "2023-03-01T00:00:00Z", target_date: "2024-01-01T00:00:00Z" },
      
      // Area: Backend (1 todo)
      { id: 4, title: "Backend Task", area: "Backend", status: "todo", created_at: "2023-01-01T00:00:00Z", target_date: "2023-01-01T00:00:00Z" },
    ];

    const areaStats = [
      { area: "Frontend", todo_count: 3, done_count: 0 },
      { area: "Backend", todo_count: 1, done_count: 5 },
    ];

    const mockTaskRepo: Partial<ITaskRepository> = {
      getAreaStats: mock(async () => areaStats),
      getInertiaTasks: mock(async () => []),
      getOutdatedTasks: mock(async () => []),
      findByProjectId: mock(async () => tasks as TaskData[]),
    };

    const useCase = new GetGovernanceUseCase(mockTaskRepo as ITaskRepository);
    const result = await useCase.execute("user-1", 1);

    expect(result.nextStep).toBeDefined();
    expect(result.nextStep?.area).toBe("Frontend");
    
    // Logic: 
    // 1. Area with most todo: Frontend
    // 2. Filter tasks in Frontend: ID 1, 2, 3
    // 3. Sort by target_date ASC: 2 and 3 (2024-01-01) < 1 (2024-12-01)
    // 4. Tie break by created_at DESC (data maior): 3 (March) > 2 (Feb)
    expect(result.nextStep?.task?.id).toBe(3);
  });
});
