"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import { FaFolderOpen, FaCertificate, FaBriefcase, FaUser, FaSignOutAlt, FaTimes } from "react-icons/fa";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FaFolderOpen,
  FaCertificate,
  FaBriefcase,
  FaUser,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border-subtle flex flex-col
        transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:transition-none
      `}
    >
      <div className="p-6 border-b border-border-subtle flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-text-primary">
          JRS <span className="text-accent-purple">Admin</span>
        </Link>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-accent-pink transition-colors cursor-pointer md:hidden"
          aria-label="Close menu"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = iconMap[link.icon];
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent-purple/10 text-accent-purple"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
              }`}
            >
              {Icon && <Icon size={16} />}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-text-muted hover:text-accent-pink transition-colors w-full cursor-pointer"
        >
          <FaSignOutAlt size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
