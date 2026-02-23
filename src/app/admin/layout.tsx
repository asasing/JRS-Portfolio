"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { FaBars } from "react-icons/fa";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-bg-card border-b border-border-subtle px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border-subtle text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <FaBars size={16} />
        </button>
        <span className="text-lg font-bold text-text-primary">
          JRS <span className="text-accent-purple">Admin</span>
        </span>
      </div>

      {/* Backdrop overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
