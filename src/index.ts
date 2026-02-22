import { serve } from "bun";
import index from "./index.html";
import { ProjectRepository } from "./infrastructure/ProjectRepository";
import { TaskRepository } from "./infrastructure/TaskRepository";
import { DocRepository } from "./infrastructure/DocRepository";
import { AddProjectUseCase } from "./application/AddProjectUseCase";
import { UpdateProjectUseCase } from "./application/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "./application/DeleteProjectUseCase";
import { GetTasksUseCase } from "./application/GetTasksUseCase";
import { AddTaskUseCase } from "./application/AddTaskUseCase";
import { UpdateTaskUseCase } from "./application/UpdateTaskUseCase";
import { DeleteTaskUseCase } from "./application/DeleteTaskUseCase";
import { SaveDocUseCase } from "./application/SaveDocUseCase";
import { GetGovernanceUseCase } from "./application/GetGovernanceUseCase";
import { ParseDocumentUseCase } from "./application/ParseDocumentUseCase";
import { ImportTasksUseCase } from "./application/ImportTasksUseCase";
import { TransitionPhaseUseCase } from "./application/TransitionPhaseUseCase";
import { ParseDocDocumentUseCase } from "./application/ParseDocDocumentUseCase";
import { ImportDocUseCase } from "./application/ImportDocUseCase";
import { GetDocTreeUseCase } from "./application/GetDocTreeUseCase";
import { DocMarkdownParser } from "./infrastructure/parsers/DocMarkdownParser";
import { DocTextParser } from "./infrastructure/parsers/DocTextParser";
import { DocPDFParser } from "./infrastructure/parsers/DocPDFParser";
import { authenticate } from "./middleware/authMiddleware";

const projectRepo = new ProjectRepository();
const taskRepo = new TaskRepository();
const docRepo = new DocRepository();

const addProjectUseCase = new AddProjectUseCase(projectRepo, taskRepo);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepo);
const deleteProjectUseCase = new DeleteProjectUseCase(projectRepo);
const getTasksUseCase = new GetTasksUseCase(taskRepo);
const addTaskUseCase = new AddTaskUseCase(taskRepo);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepo);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepo);
const getDocTreeUseCase = new GetDocTreeUseCase(docRepo);
const saveDocUseCase = new SaveDocUseCase(docRepo);
const getGovernanceUseCase = new GetGovernanceUseCase(taskRepo);
const parseDocumentUseCase = new ParseDocumentUseCase();
const importTasksUseCase = new ImportTasksUseCase(projectRepo, taskRepo);
const transitionPhaseUseCase = new TransitionPhaseUseCase(projectRepo, taskRepo);

const docParsers = [
  new DocMarkdownParser(),
  new DocTextParser(),
  new DocPDFParser(),
];
const parseDocDocumentUseCase = new ParseDocDocumentUseCase(docParsers);
const importDocUseCase = new ImportDocUseCase(docRepo);

async function handleProtected(req: Request, handler: (userId: string) => Promise<Response>) {
  const userId = await authenticate(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return await handler(userId);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("required") || message.includes("No fields") || message.includes("Unauthorized") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

const server = serve({
  routes: {
    // Static assets
    "/index.css": new Response(Bun.file("./src/index.css")),

    // API routes
    "/api/projects": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const projects = await projectRepo.findAll(userId);
          return Response.json(projects);
        });
      },
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const { name, type, initialPhaseName, tasks } = await req.json();
          const result = await addProjectUseCase.execute(userId, name, type, initialPhaseName, tasks);
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/parse-document": {
      async POST(req) {
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

          const result = await parseDocumentUseCase.execute(content, fileType);
          return Response.json(result);
        });
      },
    },

    "/api/import-project": {
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const parsedProject = await req.json();
          const result = await importTasksUseCase.execute(userId, parsedProject);
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/projects/:id": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const project = await projectRepo.findById(userId, id);
          if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
          return Response.json(project);
        });
      },
      async PATCH(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const updates = await req.json();
          await updateProjectUseCase.execute(userId, id, updates);
          return Response.json({ success: true });
        });
      },
      async DELETE(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          await deleteProjectUseCase.execute(userId, id);
          return Response.json({ success: true });
        });
      },
    },

    "/api/projects/:id/transition": {
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const projectId = parseInt(req.params.id);
          const { nextPhaseName, tasks } = await req.json();
          await transitionPhaseUseCase.execute(userId, projectId, nextPhaseName, tasks);
          return Response.json({ success: true });
        });
      },
    },

    "/api/projects/:id/tasks": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const tasks = await getTasksUseCase.execute(userId, id);
          return Response.json(tasks);
        });
      },
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const project_id = parseInt(req.params.id);
          const data = await req.json();
          const result = await addTaskUseCase.execute(userId, { ...data, project_id });
          return Response.json(result, { status: 201 });
        });
      },
    },

    "/api/parse-doc-hierarchy": {
      async POST(req) {
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

          const result = await parseDocDocumentUseCase.execute(content, filename);
          return Response.json(result);
        });
      },
    },

    "/api/projects/:id/import-docs": {
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const projectId = parseInt(req.params.id);
          const sections = await req.json();
          await importDocUseCase.execute(userId, projectId, sections);
          return Response.json({ success: true }, { status: 201 });
        });
      },
    },

    "/api/projects/:id/docs": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const docs = await getDocTreeUseCase.execute(userId, id);
          return Response.json(docs);
        });
      },
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const project_id = parseInt(req.params.id);
          const data = await req.json();
          const result = await saveDocUseCase.execute(userId, { ...data, project_id });
          return Response.json(result);
        });
      },
    },

    "/api/tasks/:id": {
      async PATCH(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const updates = await req.json();
          await updateTaskUseCase.execute(userId, id, updates);
          return Response.json({ success: true });
        });
      },
      async DELETE(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          await deleteTaskUseCase.execute(userId, id);
          return Response.json({ success: true });
        });
      },
    },

    "/api/projects/:id/governance": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const report = await getGovernanceUseCase.execute(userId, id);
          return Response.json(report);
        });
      },
    },

    // Catch-all for SPA: serve index.html for any other route
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
