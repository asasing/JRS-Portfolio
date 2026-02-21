"use client";

import { useState, useEffect, useCallback } from "react";
import { Certification } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  CERTIFICATION_PALETTE_CODES,
  CERT_PROVIDER_PALETTES,
  resolvePaletteCodeFromProvider,
  sanitizePaletteCode,
} from "@/lib/certification-palettes";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";

type CertificationFormState = Omit<Certification, "id">;

const emptyCert: CertificationFormState = {
  name: "",
  year: "",
  organization: "",
  description: "",
  credentialUrl: "",
  credentialId: "",
  thumbnail: "",
  paletteCode: "provider-slate",
  badgeColor: "#8b5cf6",
  order: 0,
};

export default function AdminCertifications() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<CertificationFormState>(emptyCert);
  const [paletteManuallySet, setPaletteManuallySet] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Certification | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCerts = useCallback(async () => {
    const res = await fetch("/api/certifications");
    setCerts(await res.json());
  }, []);

  useEffect(() => {
    void fetchCerts();
  }, [fetchCerts]);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setPaletteManuallySet(false);
    setFormData({
      ...emptyCert,
      order: certs.length + 1,
      paletteCode: resolvePaletteCodeFromProvider(""),
    });
    setShowForm(true);
  };

  const openEdit = (cert: Certification) => {
    setEditing(cert);
    setIsNew(false);
    setPaletteManuallySet(false);
    setFormData({
      name: cert.name,
      year: cert.year,
      organization: cert.organization,
      description: cert.description,
      credentialUrl: cert.credentialUrl ?? "",
      credentialId: cert.credentialId ?? "",
      thumbnail: cert.thumbnail ?? "",
      paletteCode: sanitizePaletteCode(cert.paletteCode, cert.organization),
      badgeColor: cert.badgeColor,
      order: cert.order,
    });
    setShowForm(true);
  };

  const updateOrganization = (organization: string) => {
    setFormData((prev) => ({
      ...prev,
      organization,
      paletteCode: paletteManuallySet
        ? prev.paletteCode
        : resolvePaletteCodeFromProvider(organization),
    }));
  };

  const handleSave = async () => {
    const url = isNew ? "/api/certifications" : `/api/certifications/${editing!.id}`;
    const payload = {
      ...formData,
      credentialUrl: (formData.credentialUrl ?? "").trim(),
      credentialId: (formData.credentialId ?? "").trim(),
      thumbnail: (formData.thumbnail ?? "").trim(),
      paletteCode: sanitizePaletteCode(formData.paletteCode, formData.organization),
    };

    await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowForm(false);
    void fetchCerts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/certifications/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    void fetchCerts();
  };

  const sortedCerts = [...certs].sort((a, b) => a.order - b.order);

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
            {sortedCerts.map((cert) => (
              <tr key={cert.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors">
                <td className="px-6 py-4 text-sm text-text-primary">{cert.name}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{cert.organization}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{cert.year}</td>
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
              <Input
                placeholder="Organization"
                value={formData.organization}
                onChange={(e) => updateOrganization(e.target.value)}
              />
              <Input placeholder="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
            </div>
            <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <Input
              label="Credential ID (Optional)"
              placeholder="e.g. ABC-1234"
              value={formData.credentialId || ""}
              onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
            />
            <Input
              type="url"
              label="Credential Link (Optional)"
              placeholder="https://..."
              value={formData.credentialUrl || ""}
              onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
            />

            <ImageUploader
              label="Certification Thumbnail (Optional)"
              value={formData.thumbnail || ""}
              category="certifications"
              onChange={(path) => setFormData({ ...formData, thumbnail: path })}
            />

            <div>
              <label className="block text-sm text-text-muted mb-2">Provider Palette</label>
              <select
                value={formData.paletteCode}
                onChange={(e) => {
                  setPaletteManuallySet(true);
                  setFormData({ ...formData, paletteCode: e.target.value });
                }}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-colors"
              >
                {CERTIFICATION_PALETTE_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CERTIFICATION_PALETTE_CODES.map((code) => {
                  const palette = CERT_PROVIDER_PALETTES[code];
                  return (
                    <button
                      key={`palette-${code}`}
                      type="button"
                      onClick={() => {
                        setPaletteManuallySet(true);
                        setFormData({ ...formData, paletteCode: code });
                      }}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        formData.paletteCode === code ? "border-accent-purple" : "border-border-subtle"
                      }`}
                      style={{ backgroundColor: palette.bgTint, color: palette.textColor }}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input type="number" placeholder="Order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })} />

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
