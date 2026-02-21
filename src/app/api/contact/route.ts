import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { normalizeContactMessage } from "@/lib/contact-message-normalizers";

export const runtime = "nodejs";

const DEFAULT_RECIPIENT = "johnroldansasing@gmail.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const messageHtml = body?.messageHtml;
    const messageText = body?.message;
    const normalizedMessage = normalizeContactMessage(messageHtml, messageText);

    if (!name || !email || !subject || !normalizedMessage.text) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (normalizedMessage.text.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const { host, port, secure, user, pass, to } = getEmailConfig();
    const isDryRun = process.env.CONTACT_DRY_RUN === "true";

    if (!user || !pass) {
      if (isDryRun) {
        console.info("[contact] dry run accepted without SMTP credentials", {
          name,
          email,
          subject,
        });
        return NextResponse.json({ success: true, message: "Message received (dry run)" });
      }
      return NextResponse.json(
        { error: "Email service unavailable. SMTP credentials are not configured." },
        { status: 503 }
      );
    }

    if (isDryRun) {
      console.info("[contact] dry run accepted (SMTP send skipped)", {
        name,
        email,
        subject,
      });
      return NextResponse.json({ success: true, message: "Message received (dry run)" });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from: `"Portfolio Contact" <${user}>`,
        to,
        subject: `[Portfolio Contact] ${subject}`,
        replyTo: email,
        text: [
          "New contact form submission",
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject}`,
          "",
          "Message:",
          normalizedMessage.text,
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New contact form submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <div style="white-space: normal; font-family: inherit;">${normalizedMessage.html}</div>
          </div>
        `,
      });
    } catch (error) {
      const nodeError = error as { code?: string; responseCode?: number };
      const smtpCode = nodeError.code || "";
      const smtpResponse = Number(nodeError.responseCode || 0);

      console.error("Contact SMTP send error:", error);

      if (smtpCode === "EAUTH" || smtpResponse === 535) {
        return NextResponse.json(
          { error: "Email authentication failed. Check SMTP credentials/app password." },
          { status: 502 }
        );
      }

      if (smtpCode === "ECONNECTION" || smtpCode === "ETIMEDOUT") {
        return NextResponse.json(
          { error: "Could not connect to email server. Please try again later." },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "Email service failed to send message. Please try again later." },
        { status: 502 }
      );
    }

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
