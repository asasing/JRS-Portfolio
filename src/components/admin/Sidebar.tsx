"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import { FaFolderOpen, FaCertificate, FaBriefcase, FaUser, FaSignOutAlt } from "react-icons/fa";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FaFolderOpen,
  FaCertificate,
  FaBriefcase,
  FaUser,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-bg-card border-r border-border-subtle flex flex-col">
      <div className="p-6 border-b border-border-subtle">
        <Link href="/" className="text-lg font-bold text-text-primary">
          JRS <span className="text-accent-purple">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = iconMap[link.icon];
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
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
