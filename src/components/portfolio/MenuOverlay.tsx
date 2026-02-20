"use client";

import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS } from "@/lib/constants";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const handleNavClick = (href: string) => {
    onClose();
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #1a0a2e 0%, #3b0764 50%, #0a0a0a 100%)",
          }}
        >
          {/* Close area */}
          <button
            onClick={onClose}
            className="absolute top-5 right-6 md:right-12 flex items-center gap-2 px-5 py-2.5 border border-white/20 rounded-full text-sm text-white hover:border-white/50 transition-colors cursor-pointer"
          >
            CLOSE
            <span className="w-1.5 h-1.5 rounded-full bg-year-green" />
          </button>

          <nav className="flex flex-col items-start gap-6">
            {NAV_LINKS.map((link, i) => (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => handleNavClick(link.href)}
                className="text-3xl md:text-4xl font-medium text-white hover:text-accent-purple transition-colors cursor-pointer"
              >
                {link.label === "Contact" ? (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">-&gt;</span> {link.label}
                  </span>
                ) : (
                  link.label
                )}
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
