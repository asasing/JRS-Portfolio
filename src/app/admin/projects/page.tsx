"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";

const emptyProject: Omit<Project, "id"> = {
  title: "", category: "", description: "", thumbnail: "",
  thumbnailFocusX: 50, thumbnailFocusY: 50, thumbnailZoom: 1,
  gallery: [], links: [], order: 0,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState(emptyProject);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setFormData({ ...emptyProject, order: projects.length + 1 });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setIsNew(false);
    setFormData({
      title: project.title, category: project.category, description: project.description,
      thumbnail: project.thumbnail,
      thumbnailFocusX: Number.isFinite(project.thumbnailFocusX) ? Math.min(100, Math.max(0, Number(project.thumbnailFocusX))) : 50,
      thumbnailFocusY: Number.isFinite(project.thumbnailFocusY) ? Math.min(100, Math.max(0, Number(project.thumbnailFocusY))) : 50,
      thumbnailZoom: Number.isFinite(project.thumbnailZoom) ? Math.min(3, Math.max(1, Number(project.thumbnailZoom))) : 1,
      gallery: project.gallery,
      links: project.links,
      order: project.order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const url = isNew ? "/api/projects" : `/api/projects/${editing!.id}`;
    const method = isNew ? "POST" : "PUT";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setShowForm(false);
    fetchProjects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchProjects();
  };

  const addLink = () => {
    setFormData({ ...formData, links: [...formData.links, { label: "", url: "" }] });
  };

  const removeLink = (i: number) => {
    setFormData({ ...formData, links: formData.links.filter((_, idx) => idx !== i) });
  };

  const addGalleryImage = () => {
    setFormData({ ...formData, gallery: [...formData.gallery, ""] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <Button size="admin" onClick={openNew}>
          <span className="flex items-center gap-2"><FaPlus size={12} /> Add Project</span>
        </Button>
      </div>

      {/* Projects table */}
      <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Title</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Category</th>
              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Order</th>
              <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.sort((a, b) => a.order - b.order).map((project) => (
              <tr key={project.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors">
                <td className="px-6 py-4 text-sm text-text-primary">{project.title}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{project.category}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{project.order}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(project)} className="text-text-muted hover:text-accent-purple transition-colors mr-3 cursor-pointer">
                    <FaEdit size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(project)} className="text-text-muted hover:text-accent-pink transition-colors cursor-pointer">
                    <FaTrash size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">No projects yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">{isNew ? "Add Project" : "Edit Project"}</h2>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>

            <RichTextEditor
              label="Description"
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
            />

            <Input type="number" placeholder="Order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />

            <ImageUploader
              label="Thumbnail"
              value={formData.thumbnail}
              enablePositioning
              focusX={formData.thumbnailFocusX}
              focusY={formData.thumbnailFocusY}
              zoom={formData.thumbnailZoom}
              onFocusChange={(x, y, zoom) =>
                setFormData({ ...formData, thumbnailFocusX: x, thumbnailFocusY: y, thumbnailZoom: zoom })
              }
              onChange={(path) =>
                setFormData({
                  ...formData,
                  thumbnail: path,
                  ...(path ? {} : { thumbnailFocusX: 50, thumbnailFocusY: 50, thumbnailZoom: 1 }),
                })
              }
            />

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-muted">Gallery Images</label>
                <button type="button" onClick={addGalleryImage} className="text-xs text-accent-purple hover:text-accent-magenta cursor-pointer">+ Add Image</button>
              </div>
              <div className="space-y-3">
                {formData.gallery.map((img, i) => (
                  <div key={i} className="border border-border-subtle rounded-xl p-3">
                    <ImageUploader
                      label={`Gallery Image ${i + 1}`}
                      value={img}
                      onChange={(path) => {
                        const g = [...formData.gallery];
                        g[i] = path;
                        setFormData({ ...formData, gallery: g });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gallery: formData.gallery.filter((_, idx) => idx !== i) })}
                      className="mt-3 text-sm text-text-muted hover:text-accent-pink cursor-pointer"
                    >
                      Remove Image
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-muted">Links</label>
                <button type="button" onClick={addLink} className="text-xs text-accent-purple hover:text-accent-magenta cursor-pointer">+ Add Link</button>
              </div>
              <div className="space-y-2">
                {formData.links.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Label" value={link.label} onChange={(e) => {
                      const l = [...formData.links]; l[i] = { ...l[i], label: e.target.value };
                      setFormData({ ...formData, links: l });
                    }} />
                    <Input placeholder="URL" value={link.url} onChange={(e) => {
                      const l = [...formData.links]; l[i] = { ...l[i], url: e.target.value };
                      setFormData({ ...formData, links: l });
                    }} />
                    <button onClick={() => removeLink(i)} className="text-text-muted hover:text-accent-pink cursor-pointer px-2">
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button size="admin" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="admin" onClick={handleSave}>{isNew ? "Create" : "Save Changes"}</Button>
            </div>
          </div>
        </div>
      </Modal>

      <DeleteDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
