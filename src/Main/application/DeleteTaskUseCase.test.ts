import { describe, it, expect, mock } from "bun:test";
import { DeleteTaskUseCase } from "./DeleteTaskUseCase";
import type { ITaskRepository } from "./interfaces/ITaskRepository";

describe("DeleteTaskUseCase", () => {
  it("should call taskRepository.delete with correct parameters", async () => {
    const mockTaskRepo: ITaskRepository = {
      delete: mock(async () => {}),
    } as any;

    const useCase = new DeleteTaskUseCase(mockTaskRepo);
    await useCase.execute("user-1", 123);

    expect(mockTaskRepo.delete).toHaveBeenCalledWith("user-1", 123);
  });

  it("should throw error if id is not provided", async () => {
    const mockTaskRepo: ITaskRepository = {
      delete: mock(async () => {}),
    } as any;

    const useCase = new DeleteTaskUseCase(mockTaskRepo);
    
    expect(useCase.execute("user-1", 0)).rejects.toThrow("ID da tarefa é obrigatório.");
  });
});
