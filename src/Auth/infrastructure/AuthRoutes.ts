import { LoginUseCase } from "../application/LoginUseCase";
import { RegisterUseCase } from "../application/RegisterUseCase";
import { LogoutUseCase } from "../application/LogoutUseCase";
import { GetSessionUseCase } from "../application/GetSessionUseCase";
import { authenticate } from "./authMiddleware";

export function createAuthRoutes(
  loginUseCase: LoginUseCase,
  registerUseCase: RegisterUseCase,
  logoutUseCase: LogoutUseCase,
  getSessionUseCase: GetSessionUseCase
) {
  return {
    "/api/auth/login": {
      async POST(req: Request) {
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
      async POST(req: Request) {
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
      async GET(req: Request) {
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
  };
}
