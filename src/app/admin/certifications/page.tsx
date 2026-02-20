"use client";

import { useState, useEffect, useCallback } from "react";
import { Certification } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";

const emptyCert: Omit<Certification, "id"> = {
  name: "", year: "", organization: "", description: "",
  credentialUrl: "", badgeColor: "#8b5cf6", order: 0,
};

export default function AdminCertifications() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState(emptyCert);
  const [deleteTarget, setDeleteTarget] = useState<Certification | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCerts = useCallback(async () => {
    const res = await fetch("/api/certifications");
    setCerts(await res.json());
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const openNew = () => {
    setEditing(null); setIsNew(true);
    setFormData({ ...emptyCert, order: certs.length + 1 });
    setShowForm(true);
  };

  const openEdit = (cert: Certification) => {
    setEditing(cert); setIsNew(false);
    setFormData({
      name: cert.name, year: cert.year, organization: cert.organization,
      description: cert.description, credentialUrl: cert.credentialUrl ?? "",
      badgeColor: cert.badgeColor, order: cert.order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const url = isNew ? "/api/certifications" : `/api/certifications/${editing!.id}`;
    const payload = {
      ...formData,
      credentialUrl: (formData.credentialUrl ?? "").trim(),
    };

    await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    fetchCerts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/certifications/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchCerts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Certifications</h1>
        <Button size="admin" onClick={openNew}>
          <span className="flex items-center gap-2"><FaPlus size={12} /> Add Certification</span>
        </Button>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Name</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Organization</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Year</th>
              <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {certs.sort((a, b) => a.order - b.order).map((cert) => (
              <tr key={cert.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors">
                <td className="px-6 py-4 text-sm text-text-primary">{cert.name}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{cert.organization}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: cert.badgeColor + "20", color: cert.badgeColor }}>
                    {cert.year}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(cert)} className="text-text-muted hover:text-accent-purple transition-colors mr-3 cursor-pointer"><FaEdit size={14} /></button>
                  <button onClick={() => setDeleteTarget(cert)} className="text-text-muted hover:text-accent-pink transition-colors cursor-pointer"><FaTrash size={14} /></button>
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">No certifications yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">{isNew ? "Add Certification" : "Edit Certification"}</h2>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary cursor-pointer"><FaTimes size={18} /></button>
          </div>

          <div className="space-y-4">
            <Input placeholder="Certification Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
              <Input placeholder="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
            </div>
            <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <Input
              type="url"
              label="Credential Link (Optional)"
              placeholder="https://..."
              value={formData.credentialUrl || ""}
              onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Badge Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formData.badgeColor} onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })} className="w-10 h-10 rounded border-0 cursor-pointer bg-transparent" />
                  <span className="text-sm text-text-muted">{formData.badgeColor}</span>
                </div>
              </div>
              <Input type="number" placeholder="Order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button size="admin" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="admin" onClick={handleSave}>{isNew ? "Create" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      </Modal>

      <DeleteDialog isOpen={!!deleteTarget} title={deleteTarget?.name || ""} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
