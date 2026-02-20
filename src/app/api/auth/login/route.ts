import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputPassword = typeof body?.password === "string" ? body.password.trim() : "";

    if (!inputPassword) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const hashedPassword = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/^"(.*)"$/, "$1");
    const plainPassword =
      process.env.ADMIN_PASSWORD?.trim() ||
      process.env.password?.trim();

    if (!hashedPassword && !plainPassword) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let valid = false;

    if (hashedPassword) {
      try {
        valid = await verifyPassword(inputPassword, hashedPassword);
      } catch {
        valid = false;
      }
    }

    if (!valid && plainPassword) {
      valid = inputPassword === plainPassword;
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await signToken({ role: "admin" });

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
