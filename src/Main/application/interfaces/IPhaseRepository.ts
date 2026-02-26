import { PhaseData } from "../../module/interfaces/Phase";

export interface IPhaseRepository {
  findByProjectId(userId: string, projectId: number): Promise<PhaseData[]>;
  create(userId: string, phaseData: Partial<PhaseData>): Promise<PhaseData>;
  delete(userId: string, id: number): Promise<void>;
  createBatch(userId: string, phases: Partial<PhaseData>[]): Promise<void>;
}
