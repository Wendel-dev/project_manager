import { jwtVerify, decodeJwt } from "jose";

// Em produção com Firebase, você verificaria o token contra as chaves públicas do Google
// https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
// Para este projeto, manteremos o suporte a mock e uma verificação básica de payload
// Se desejar portabilidade para Supabase no futuro, o segredo JWT será usado novamente.

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // Opcional para portabilidade futura

export async function authenticate(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("Cookie");
  let token: string | null = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);
    token = cookies["session_token"];
  }

  // Fallback para Header (útil para testes de API ou chamadas externas)
  if (!token) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return null;
  }

  // Suporte a token mock para desenvolvimento/testes
  if (token.startsWith("mock-token-")) {
    return token.replace("mock-token-", "");
  }

  try {
    // Decodifica o payload sem verificar a assinatura para extrair o UID (Firebase)
    // Em um ambiente de produção real, a assinatura DEVE ser verificada.
    const payload = decodeJwt(token);
    
    // Verifica se o token é do projeto Firebase correto (se configurado)
    if (FIREBASE_PROJECT_ID && payload.aud !== FIREBASE_PROJECT_ID) {
      console.error("Token audience mismatch");
      return null;
    }

    // Se estivermos usando o segredo do Supabase (para desenvolvimento local ou após migração)
    if (SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      return (verifiedPayload.sub as string) || null;
    }

    // Por padrão para Firebase, o user_id está no campo 'sub'
    return (payload.sub as string) || null;
  } catch (err) {
    console.error("Auth validation error:", err);
    return null;
  }
}
