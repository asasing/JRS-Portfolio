import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { normalizeContactMessage } from "@/lib/contact-message-normalizers";

export const runtime = "nodejs";

const DEFAULT_RECIPIENT = "johnroldansasing@gmail.com";

function getEmailConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const to = process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_RECIPIENT;

  return { host, port, secure, user, pass, to };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const messageHtml = body?.messageHtml;
    const messageText = body?.message;
    const normalizedMessage = normalizeContactMessage(messageHtml, messageText);

    if (!name || !subject || !normalizedMessage.text) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (normalizedMessage.text.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const { host, port, secure, user, pass, to } = getEmailConfig();

    if (!user || !pass) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${user}>`,
      to,
      subject: `[Portfolio Contact] ${subject}`,
      text: [
        "New contact form submission",
        `Name: ${name}`,
        `Subject: ${subject}`,
        "",
        "Message:",
        normalizedMessage.text,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <div style="white-space: normal; font-family: inherit;">${normalizedMessage.html}</div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Message received" });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
