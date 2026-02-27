import { jwtVerify } from "jose";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "default_secret_change_me_in_production";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function authenticate(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return null;
  }

  // Mock token support for testing without Supabase
  if (token.startsWith("mock-token-")) {
    return token.replace("mock-token-", "");
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub || null; // Supabase uses 'sub' for user_id
  } catch (err) {
    console.error("JWT validation error:", err);
    return null;
  }
}
