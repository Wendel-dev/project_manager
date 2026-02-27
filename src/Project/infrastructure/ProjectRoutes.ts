import { handleProtected } from "../../Shared/infrastructure/HttpHandlers";
import { AddProjectUseCase } from "../application/AddProjectUseCase";
import { UpdateProjectUseCase } from "../application/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "../application/DeleteProjectUseCase";
import { GetTasksUseCase } from "../application/GetTasksUseCase";
import { AddTaskUseCase } from "../application/AddTaskUseCase";
import { UpdateTaskUseCase } from "../application/UpdateTaskUseCase";
import { DeleteTaskUseCase } from "../application/DeleteTaskUseCase";
import { SaveDocUseCase } from "../application/SaveDocUseCase";
import { GetGovernanceUseCase } from "../application/GetGovernanceUseCase";
import { ParseDocumentUseCase } from "../application/ParseDocumentUseCase";
import { ImportTasksUseCase } from "../application/ImportTasksUseCase";
import { CreatePhaseUseCase } from "../application/CreatePhaseUseCase";
import { ParseDocDocumentUseCase } from "../application/ParseDocDocumentUseCase";
import { ImportDocUseCase } from "../application/ImportDocUseCase";
import { GetDocTreeUseCase } from "../application/GetDocTreeUseCase";
import { IProjectRepository } from "../application/interfaces/IProjectRepository";
import { IPhaseRepository } from "../application/interfaces/IPhaseRepository";

export function createProjectRoutes(deps: {
  projectRepo: IProjectRepository,
  phaseRepo: IPhaseRepository,
  addProjectUseCase: AddProjectUseCase,
  updateProjectUseCase: UpdateProjectUseCase,
  deleteProjectUseCase: DeleteProjectUseCase,
  getTasksUseCase: GetTasksUseCase,
  addTaskUseCase: AddTaskUseCase,
  updateTaskUseCase: UpdateTaskUseCase,
  deleteTaskUseCase: DeleteTaskUseCase,
  getDocTreeUseCase: GetDocTreeUseCase,
  saveDocUseCase: SaveDocUseCase,
  getGovernanceUseCase: GetGovernanceUseCase,
  parseDocumentUseCase: ParseDocumentUseCase,
  importTasksUseCase: ImportTasksUseCase,
  createPhaseUseCase: CreatePhaseUseCase,
  parseDocDocumentUseCase: ParseDocDocumentUseCase,
  importDocUseCase: ImportDocUseCase
}) {
  return {
    "/api/projects": {
      async GET(req: Request) {
        return handleProtected(req, async (userId) => {
          const projects = await deps.projectRepo.findAll(userId);
          return Response.json(projects);
        });
      },
      async POST(req: Request) {
        return handleProtected(req, async (userId) => {
          const { name, type, initialPhaseName, tasks } = await req.json();
          const result = await deps.addProjectUseCase.execute(userId, name, type, initialPhaseName, tasks);
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/projects/:id/phases": {
      async GET(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const phases = await deps.phaseRepo.findByProjectId(userId, id);
          return Response.json(phases);
        });
      },
      async POST(req: any) {
        return handleProtected(req, async (userId) => {
          const projectId = parseInt(req.params.id);
          const { phaseName, tasks } = await req.json();
          await deps.createPhaseUseCase.execute(userId, projectId, phaseName, tasks);
          return Response.json({ success: true });
        });
      },
    },

    "/api/parse-document": {
      async POST(req: Request) {
        return handleProtected(req, async (userId) => {
          const contentType = req.headers.get("content-type") || "";
          let content: string | Buffer;
          let fileType: string = "txt";

          if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
            content = Buffer.from(await file.arrayBuffer());
            fileType = file.name.split(".").pop() || "txt";
          } else {
             content = await req.text();
             fileType = req.headers.get("X-File-Type") || "txt";
          }

          const result = await deps.parseDocumentUseCase.execute(content, fileType);
          return Response.json(result);
        });
      },
    },

    "/api/import-project": {
      async POST(req: Request) {
        return handleProtected(req, async (userId) => {
          const parsedProject = await req.json();
          const result = await deps.importTasksUseCase.execute(userId, parsedProject);
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/projects/:id": {
      async GET(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const project = await deps.projectRepo.findById(userId, id);
          if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
          return Response.json(project);
        });
      },
      async PATCH(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const updates = await req.json();
          await deps.updateProjectUseCase.execute(userId, id, updates);
          return Response.json({ success: true });
        });
      },
      async DELETE(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          await deps.deleteProjectUseCase.execute(userId, id);
          return Response.json({ success: true });
        });
      },
    },

    "/api/projects/:id/tasks": {
      async GET(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const tasks = await deps.getTasksUseCase.execute(userId, id);
          return Response.json(tasks);
        });
      },
      async POST(req: any) {
        return handleProtected(req, async (userId) => {
          const project_id = parseInt(req.params.id);
          const data = await req.json();
          const result = await deps.addTaskUseCase.execute(userId, { ...data, project_id });
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/parse-doc-hierarchy": {
      async POST(req: Request) {
        return handleProtected(req, async (userId) => {
          const contentType = req.headers.get("content-type") || "";
          let content: string | Buffer;
          let filename: string = "document.txt";

          if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
            content = Buffer.from(await file.arrayBuffer());
            filename = file.name;
          } else {
             content = await req.text();
             filename = req.headers.get("X-File-Name") || "document.txt";
          }

          const result = await deps.parseDocDocumentUseCase.execute(content, filename);
          return Response.json(result);
        });
      },
    },

    "/api/projects/:id/import-docs": {
      async POST(req: any) {
        return handleProtected(req, async (userId) => {
          const projectId = parseInt(req.params.id);
          const sections = await req.json();
          await deps.importDocUseCase.execute(userId, projectId, sections);
          return Response.json({ success: true }, { status: 201 });
        });
      },
    },

    "/api/projects/:id/docs": {
      async GET(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const docs = await deps.getDocTreeUseCase.execute(userId, id);
          return Response.json(docs);
        });
      },
      async POST(req: any) {
        return handleProtected(req, async (userId) => {
          const project_id = parseInt(req.params.id);
          const data = await req.json();
          const result = await deps.saveDocUseCase.execute(userId, { ...data, project_id });
          return Response.json(result);
        });
      },
    },

    "/api/tasks/:id": {
      async PATCH(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const updates = await req.json();
          await deps.updateTaskUseCase.execute(userId, id, updates);
          return Response.json({ success: true });
        });
      },
      async DELETE(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          await deps.deleteTaskUseCase.execute(userId, id);
          return Response.json({ success: true });
        });
      },
    },

    "/api/projects/:id/governance": {
      async GET(req: any) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const report = await deps.getGovernanceUseCase.execute(userId, id);
          return Response.json(report);
        });
      },
    },
  };
}
