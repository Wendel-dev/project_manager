import { serve } from "bun";
import index from "./index.html";
import { ProjectRepository } from "./Project/infrastructure/ProjectRepository";
import { TaskRepository } from "./Project/infrastructure/TaskRepository";
import { DocRepository } from "./Project/infrastructure/DocRepository";
import { PhaseRepository } from "./Project/infrastructure/PhaseRepository";
import { AddProjectUseCase } from "./Project/application/AddProjectUseCase";
import { UpdateProjectUseCase } from "./Project/application/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "./Project/application/DeleteProjectUseCase";
import { GetTasksUseCase } from "./Project/application/GetTasksUseCase";
import { AddTaskUseCase } from "./Project/application/AddTaskUseCase";
import { UpdateTaskUseCase } from "./Project/application/UpdateTaskUseCase";
import { DeleteTaskUseCase } from "./Project/application/DeleteTaskUseCase";
import { SaveDocUseCase } from "./Project/application/SaveDocUseCase";
import { GetGovernanceUseCase } from "./Project/application/GetGovernanceUseCase";
import { ParseDocumentUseCase } from "./Project/application/ParseDocumentUseCase";
import { ImportTasksUseCase } from "./Project/application/ImportTasksUseCase";
import { CreatePhaseUseCase } from "./Project/application/CreatePhaseUseCase";
import { ParseDocDocumentUseCase } from "./Project/application/ParseDocDocumentUseCase";
import { ImportDocUseCase } from "./Project/application/ImportDocUseCase";
import { GetDocTreeUseCase } from "./Project/application/GetDocTreeUseCase";
import { DocMarkdownParser } from "./Project/infrastructure/parsers/DocMarkdownParser";
import { DocTextParser } from "./Project/infrastructure/parsers/DocTextParser";
import { DocPDFParser } from "./Project/infrastructure/parsers/DocPDFParser";
import { authenticate } from "./Auth/infrastructure/authMiddleware";
import { PaymentRepository } from "./Payment/infrastructure/PaymentRepository";
import { PaymentFactory } from "./Payment/infrastructure/PaymentFactory";
import { ProcessPaymentUseCase } from "./Payment/application/ProcessPaymentUseCase";
import { HandlePaymentWebhookUseCase } from "./Payment/application/HandlePaymentWebhookUseCase";
import { FirebaseAuthRepository } from "./Auth/infrastructure/Firebase/FirebaseAuthRepository";
import { AuthRepositoryMock } from "./Auth/infrastructure/Mocks/AuthRepositoryMock";
import { auth } from "./Auth/infrastructure/Firebase/config";
import { LoginUseCase } from "./Auth/application/LoginUseCase";
import { RegisterUseCase } from "./Auth/application/RegisterUseCase";
import { LogoutUseCase } from "./Auth/application/LogoutUseCase";
import { GetSessionUseCase } from "./Auth/application/GetSessionUseCase";

const projectRepo = new ProjectRepository();
const taskRepo = new TaskRepository();
const docRepo = new DocRepository();
const phaseRepo = new PhaseRepository();
const paymentRepo = new PaymentRepository();

// Auth setup (only on backend)
const authRepository = (process.env.NODE_ENV === "test" || !process.env.VITE_FIREBASE_API_KEY)
  ? new AuthRepositoryMock() 
  : new FirebaseAuthRepository(auth);
console.log(process.env.NODE_ENV)
const loginUseCase = new LoginUseCase(authRepository);
const registerUseCase = new RegisterUseCase(authRepository);
const logoutUseCase = new LogoutUseCase(authRepository);
const getSessionUseCase = new GetSessionUseCase(authRepository);

const paymentProvider = PaymentFactory.create();
const processPaymentUseCase = new ProcessPaymentUseCase(paymentProvider, paymentRepo);
const handlePaymentWebhookUseCase = new HandlePaymentWebhookUseCase(paymentProvider, paymentRepo);

const addProjectUseCase = new AddProjectUseCase(projectRepo, taskRepo, phaseRepo);
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
const importTasksUseCase = new ImportTasksUseCase(projectRepo, taskRepo, phaseRepo);
const createPhaseUseCase = new CreatePhaseUseCase(projectRepo, taskRepo, phaseRepo);

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

process.env.NODE_ENV = "test"

const server = serve({
  routes: {
    // Static assets
    "/index.css": new Response(Bun.file("./src/index.css")),

    // Auth routes
    "/api/auth/login": {
      async POST(req) {
        try {
          const { email, password } = await req.json();
          const { user, token } = await loginUseCase.execute(email, password);
          
          return new Response(JSON.stringify(user), {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
            },
          });
        } catch (error) {
          console.log("Login error:", error);
          return Response.json({ error: (error as Error).message }, { status: 401 });
        }
      },
    },

    "/api/auth/register": {
      async POST(req) {
        try {
          const { email, password } = await req.json();
          const { user, token } = await registerUseCase.execute(email, password);
          
          return new Response(JSON.stringify(user), {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
            },
          });
        } catch (error) {
          return Response.json({ error: (error as Error).message }, { status: 400 });
        }
      },
    },

    "/api/auth/logout": {
      async POST() {
        await logoutUseCase.execute();
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
          },
        });
      },
    },

    "/api/auth/me": {
      async GET(req) {
        const userId = await authenticate(req);
        if (!userId) return Response.json(null);

        // Extract token from cookie for GetSessionUseCase
        const cookieHeader = req.headers.get("Cookie");
        const cookies = cookieHeader?.split(";").reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (!name || !value) return acc;
          acc[name] = value;
          return acc;
        }, {} as Record<string, string>);
        const token = cookies?.["session_token"];

        if (!token) return Response.json(null);

        const user = await getSessionUseCase.execute(token);
        return Response.json(user);
      },
    },

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

    "/api/projects/:id/phases": {
      async GET(req) {
        return handleProtected(req, async (userId) => {
          const id = parseInt(req.params.id);
          const phases = await phaseRepo.findByProjectId(userId, id);
          return Response.json(phases);
        });
      },
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const projectId = parseInt(req.params.id);
          const { phaseName, tasks } = await req.json();
          await createPhaseUseCase.execute(userId, projectId, phaseName, tasks);
          return Response.json({ success: true });
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

    "/api/payments/checkout": {
      async POST(req) {
        return handleProtected(req, async (userId) => {
          const { amount, currency, successUrl, cancelUrl, metadata } = await req.json();
          // Ideally get user email from a UserUseCase or Auth service
          const result = await processPaymentUseCase.execute({
            amount,
            currency,
            successUrl,
            cancelUrl,
            customerEmail: userId, // Placeholder if we don't have email yet
            metadata: { ...metadata, userId },
          });
          return Response.json(result);
        });
      },
    },

    "/api/webhooks/stripe": {
      async POST(req) {
        try {
          const signature = req.headers.get("stripe-signature") || "";
          const payload = await req.text();
          await handlePaymentWebhookUseCase.execute(payload, signature);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error:", error);
          return Response.json({ error: (error as Error).message }, { status: 400 });
        }
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
