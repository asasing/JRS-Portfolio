import { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export async function authenticateRequest(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get("admin_token");
  const authHeader = req.headers.get("authorization");

  const token = cookie?.value || authHeader?.replace("Bearer ", "");
  if (!token) return false;

  const payload = await verifyToken(token);
  return payload !== null;
}
