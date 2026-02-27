import { authenticate } from "../../Auth/infrastructure/authMiddleware";

export async function handleProtected(req: Request, handler: (userId: string) => Promise<Response>) {
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

export function handleResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export async function parseFormData(req: Request): Promise<{ content: Buffer | string, fileName: string }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");
    const content = Buffer.from(await file.arrayBuffer());
    return { content, fileName: file.name };
  } else {
    const content = await req.text();
    const fileName = req.headers.get("X-File-Name") || "document.txt";
    return { content, fileName };
  }
}
