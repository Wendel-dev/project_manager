import { expect, test, describe, mock } from "bun:test";
import { ImportTasksUseCase } from "./ImportTasksUseCase";
import { ParsedPhase } from "../module/interfaces/ParsedProject";

describe("ImportTasksUseCase", () => {
  test("should create project and tasks", async () => {
    const projectRepoMock = {
      create: mock(async () => ({ id: 1 })),
      findAll: mock(),
      findById: mock(),
      update: mock()
    };
    const taskRepoMock = {
      create: mock(async () => 1),
      findByProjectId: mock(),
      findById: mock(),
      update: mock(),
      getAreaStats: mock(),
      getInertiaTasks: mock(),
      getOutdatedTasks: mock()
    };
    const phaseRepoMock = {
      create: mock(async () => ({ id: 10 })),
      findByProjectId: mock(async () => []),
      delete: mock(),
      createBatch: mock()
    };

    const useCase = new ImportTasksUseCase(projectRepoMock as any, taskRepoMock as any, phaseRepoMock as any);
    
    const parsedProject: ParsedPhase = {
      name: "Fase Importada",
      tasks: [
        { title: "Task 1", description: "Desc 1", checklists: [{ text: "Item 1", completed: false }] },
        { title: "Task 2", description: "Desc 2", checklists: [] }
      ]
    };

    const result = await useCase.execute("user123", parsedProject);

    expect(result.projectId).toBe(1);
    expect(projectRepoMock.create).toHaveBeenCalled();
    expect(taskRepoMock.create).toHaveBeenCalledTimes(2);
  });
});
