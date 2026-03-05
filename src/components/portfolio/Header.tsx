"use client";

import { useState } from "react";
import { CALENDLY_URL, SITE_NAME } from "@/lib/constants";
import MenuOverlay from "./MenuOverlay";

interface HeaderProps {
  navLinks: { label: string; href: string }[];
}

export default function Header({ navLinks }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 py-4 bg-bg-primary/80 backdrop-blur-sm border-b border-border-subtle/20">
        <div className="site-container flex items-center justify-between">
          <a href="#" className="text-xl font-bold text-text-primary tracking-wider">
            {SITE_NAME}
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={scrollToContact}
              className="hidden sm:flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 border border-border-subtle rounded-full text-sm text-text-primary hover:border-accent-purple transition-colors cursor-pointer"
            >
              Send a Message
              <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
            </button>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 border border-border-subtle rounded-full text-sm text-text-primary hover:border-accent-purple transition-colors"
            >
              BOOK A CALL
              <span className="w-1.5 h-1.5 rounded-full bg-year-green" />
            </a>
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-bg-card border border-border-subtle rounded-full text-sm text-text-primary hover:border-accent-purple transition-colors cursor-pointer"
            >
              MENU
              <span className="w-1.5 h-1.5 rounded-full bg-year-green" />
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        navLinks={navLinks}
      />
    </>
  );
}
