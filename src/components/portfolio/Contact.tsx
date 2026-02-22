"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface ContactProps {
  profile: Profile;
}

export default function Contact({ profile }: ContactProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    messageHtml: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Failed to send. Please try again.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("Failed to send. Please try again.");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          messageHtml: formData.messageHtml,
        }),
      });

      if (res.ok) {
        setStatus("sent");
        setFormData({ name: "", email: "", subject: "", messageHtml: "" });
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error) {
          setErrorMessage(payload.error);
        }
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="portfolio-section">
      <div className="site-container">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12 mb-10 md:mb-12">
          <SectionHeading overline="CONTACT" title="Let's Talk" gradientWord="Talk" />
          <div className="flex flex-row gap-8 md:gap-16 md:mt-2">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">Email</h4>
              <p className="text-text-primary text-sm md:text-base">{profile.email}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">Phone</h4>
              <p className="text-text-primary text-sm md:text-base">{profile.phone}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <RichTextEditor
            label="Message"
            value={formData.messageHtml}
            allowHeadings={false}
            allowImage={false}
            allowLinks
            minHeightClassName="min-h-52"
            onChange={(messageHtml) => setFormData({ ...formData, messageHtml })}
          />
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm">
              {status === "sent" && (
                <span className="text-year-green flex flex-col leading-snug gap-0.5">
                  <span>Thank you for reaching out.</span>
                  <span>We&apos;ll get back to you as soon as possible.</span>
                </span>
              )}
              {status === "error" && <span className="text-accent-pink">{errorMessage}</span>}
            </div>
            <Button type="submit" size="md" className="px-10 py-4" disabled={status === "sending"}>
              {status === "sending" ? "SENDING..." : "SEND MESSAGE ->"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
