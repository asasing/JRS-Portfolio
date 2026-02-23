"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Certification } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CERTIFICATION_PALETTE_CODES,
  CERT_PROVIDER_PALETTES,
  resolvePaletteCodeFromProvider,
  sanitizePaletteCode,
} from "@/lib/certification-palettes";
import {
  collectCertificationFilePreviews,
  collectCertificationImagePreview,
  collectCertificationLinkPreview,
} from "@/lib/admin-preview";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaGripVertical,
  FaSave,
  FaExternalLinkAlt,
  FaPaperclip,
} from "react-icons/fa";

type CertificationFormState = Omit<Certification, "id">;

const emptyCert: CertificationFormState = {
  name: "",
  year: "",
  organization: "",
  description: "",
  credentialUrl: "",
  credentialId: "",
  thumbnail: "",
  attachments: [],
  paletteCode: "provider-slate",
  badgeColor: "#8b5cf6",
  order: 0,
};

function reindexCerts(certs: Certification[]): Certification[] {
  return certs.map((cert, index) => ({
    ...cert,
    order: index + 1,
  }));
}

interface SortableCertificationRowProps {
  cert: Certification;
  onEdit: (cert: Certification) => void;
  onDelete: (cert: Certification) => void;
}

function SortableCertificationRow({ cert, onEdit, onDelete }: SortableCertificationRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cert.id,
  });
  const thumbnail = collectCertificationImagePreview(cert);
  const files = collectCertificationFilePreviews(cert);
  const credentialLink = collectCertificationLinkPreview(cert);
  const paletteCode = sanitizePaletteCode(cert.paletteCode, cert.organization);
  const palette = CERT_PROVIDER_PALETTES[paletteCode];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-lg border border-border-subtle bg-bg-card px-4 py-3 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder certification"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>

      <div className="min-w-0">
        <div className="flex items-start gap-3">
          {thumbnail ? (
            <a
              href={thumbnail}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-mini-thumb relative shrink-0"
              title="Open thumbnail"
            >
              <Image src={thumbnail} alt={`${cert.name} thumbnail`} fill className="object-cover" sizes="32px" />
            </a>
          ) : (
            <span className="admin-mini-thumb inline-flex shrink-0 items-center justify-center text-[10px] text-text-muted">N/A</span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{cert.name}</p>
            <p className="text-xs text-text-muted mt-1 truncate">{cert.organization} • {cert.year}</p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="admin-meta-chip"
            style={{ backgroundColor: palette.bgTint, color: palette.textColor }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: palette.textColor }} />
            {paletteCode}
          </span>
          <span className="admin-meta-chip">🖼 {thumbnail ? 1 : 0}</span>
          <span className="admin-meta-chip">📄 {files.length}</span>
          <span className="admin-meta-chip">🔗 {credentialLink ? 1 : 0}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {thumbnail && (
            <a href={thumbnail} target="_blank" rel="noopener noreferrer" className="admin-preview-row">
              Open image
            </a>
          )}
          {credentialLink && (
            <a href={credentialLink} target="_blank" rel="noopener noreferrer" className="admin-preview-row">
              Open link
            </a>
          )}
          {files[0] && (
            <a href={files[0].url} target="_blank" rel="noopener noreferrer" className="admin-preview-row">
              Open file
            </a>
          )}
          {!thumbnail && !credentialLink && files.length === 0 && (
            <span className="text-[11px] text-text-muted">No media/links</span>
          )}
        </div>
      </div>

      <span className="text-xs text-text-muted">#{cert.order}</span>

      <div className="flex items-center gap-3">
        <button onClick={() => onEdit(cert)} className="text-text-muted hover:text-accent-purple transition-colors cursor-pointer"><FaEdit size={14} /></button>
        <button onClick={() => onDelete(cert)} className="text-text-muted hover:text-accent-pink transition-colors cursor-pointer"><FaTrash size={14} /></button>
      </div>
    </div>
  );
}

export default function AdminCertifications() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<CertificationFormState>(emptyCert);
  const [paletteManuallySet, setPaletteManuallySet] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Certification | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCerts = useCallback(async () => {
    const res = await fetch("/api/certifications");
    const data = await res.json();
    setCerts(Array.isArray(data) ? data : []);
    setOrderDirty(false);
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
      attachments: [],
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
      attachments: Array.isArray(cert.attachments) ? cert.attachments : [],
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
      order: isNew ? certs.length + 1 : editing?.order ?? formData.order,
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

  const saveOrder = async () => {
    setSavingOrder(true);
    setOrderSaved(false);

    const orderedIds = [...certs]
      .sort((a, b) => a.order - b.order)
      .map((cert) => cert.id);

    const res = await fetch("/api/certifications/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });

    if (res.ok) {
      const data = await res.json();
      setCerts(Array.isArray(data) ? data : []);
      setOrderDirty(false);
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2000);
    }

    setSavingOrder(false);
  };

  const handleOrderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...certs].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((cert) => cert.id === active.id);
    const newIndex = sorted.findIndex((cert) => cert.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);
    setCerts(reindexCerts(reordered));
    setOrderDirty(true);
  };

  const sortedCerts = [...certs].sort((a, b) => a.order - b.order);
  const formCertThumbnail = collectCertificationImagePreview(formData);
  const formCertFiles = collectCertificationFilePreviews(formData);
  const formCredentialLink = collectCertificationLinkPreview(formData);
  const formPaletteCode = sanitizePaletteCode(formData.paletteCode, formData.organization);
  const formPalette = CERT_PROVIDER_PALETTES[formPaletteCode];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Certifications</h1>
        <Button size="admin" onClick={openNew}>
          <span className="flex items-center gap-2"><FaPlus size={12} /> Add Certification</span>
        </Button>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Certification Order</h2>
          <div className="flex items-center gap-2">
            {orderSaved && <span className="text-sm text-year-green">Saved!</span>}
            <Button size="admin" onClick={saveOrder} disabled={savingOrder || !orderDirty}>
              <span className="flex items-center gap-2">
                <FaSave size={12} /> {savingOrder ? "Saving..." : "Save Certification Order"}
              </span>
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOrderDragEnd}>
          <SortableContext items={sortedCerts.map((cert) => cert.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedCerts.map((cert) => (
                <SortableCertificationRow
                  key={cert.id}
                  cert={cert}
                  onEdit={openEdit}
                  onDelete={(item) => setDeleteTarget(item)}
                />
              ))}
              {sortedCerts.length === 0 && (
                <p className="text-sm text-text-muted">No certifications yet.</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
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

            <div className="rounded-xl border border-border-subtle bg-bg-input p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">Preview</h3>

              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Thumbnail</p>
                {formCertThumbnail ? (
                  <a
                    href={formCertThumbnail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-mini-thumb relative inline-block"
                  >
                    <Image src={formCertThumbnail} alt="Certification thumbnail preview" fill className="object-cover" sizes="32px" />
                  </a>
                ) : (
                  <p className="text-xs text-text-muted">No thumbnail attached</p>
                )}
              </div>

              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Palette</p>
                <span
                  className="admin-meta-chip"
                  style={{ backgroundColor: formPalette.bgTint, color: formPalette.textColor }}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: formPalette.textColor }} />
                  {formPaletteCode}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Credential Link</p>
                {formCredentialLink ? (
                  <a
                    href={formCredentialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-preview-row w-fit"
                  >
                    <FaExternalLinkAlt size={10} />
                    Open credential link
                  </a>
                ) : (
                  <p className="text-xs text-text-muted">No credential link</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Files</p>
                {formCertFiles.length > 0 ? (
                  <div className="space-y-1">
                    {formCertFiles.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-preview-row w-fit"
                      >
                        <FaPaperclip size={10} />
                        {attachment.label || attachment.url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No files attached</p>
                )}
              </div>
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
