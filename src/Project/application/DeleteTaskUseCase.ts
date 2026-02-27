import type { ITaskRepository } from "./interfaces/ITaskRepository";

export class DeleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, id: number): Promise<void> {
    if (!id) {
      throw new Error("ID da tarefa é obrigatório.");
    }

    // A cláusula WHERE do DELETE no repositório já garante que apenas o dono pode deletar.
    await this.taskRepository.delete(userId, id);
  }
}
