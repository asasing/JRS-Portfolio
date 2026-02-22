import type { Metadata } from "next";
import { Inter, Dancing_Script, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "John Roldan Sasing | Portfolio",
  description:
    "Full Stack Developer - Personal Portfolio. Building modern web applications with clean, efficient, and user-friendly digital experiences.",
  keywords: [
    "portfolio",
    "developer",
    "full stack",
    "web development",
    "react",
    "nextjs",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dancingScript.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
