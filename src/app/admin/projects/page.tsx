"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Project, ProjectCategory } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
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
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaGripVertical,
  FaSave,
} from "react-icons/fa";
import { DEFAULT_PROJECT_THUMBNAIL } from "@/lib/constants";

type ProjectFormState = Omit<Project, "id"> & { categories: string[] };

const emptyProject: ProjectFormState = {
  title: "",
  category: "",
  categories: [],
  description: "",
  thumbnail: "",
  thumbnailFocusX: 50,
  thumbnailFocusY: 50,
  thumbnailZoom: 1,
  gallery: [],
  links: [],
  order: 0,
};

function normalizeFormCategories(categories: unknown, category: unknown): string[] {
  const fromArray = Array.isArray(categories)
    ? categories
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }

  const legacy = typeof category === "string" ? category.trim() : "";
  return legacy ? [legacy] : [];
}

function projectCategoryLabel(project: Project): string {
  const categories = normalizeFormCategories(project.categories, project.category);
  return categories.join(", ") || "-";
}

function reindexCategories(categories: ProjectCategory[]): ProjectCategory[] {
  return categories.map((category, index) => ({
    ...category,
    order: index + 1,
  }));
}

interface SortableCategoryRowProps {
  category: ProjectCategory;
  onChangeLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}

function SortableCategoryRow({
  category,
  onChangeLabel,
  onRemove,
}: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-input px-2 py-2 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder category"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>

      <input
        type="text"
        value={category.label}
        onChange={(event) => onChangeLabel(category.id, event.target.value)}
        placeholder="Category label"
        className="h-9 w-full rounded-md border border-border-subtle bg-bg-card px-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple"
      />

      <button
        type="button"
        onClick={() => onRemove(category.id)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-pink cursor-pointer"
        aria-label="Remove category"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<ProjectFormState>(emptyProject);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  const [categoriesDirty, setCategoriesDirty] = useState(false);
  const categoryIdCounter = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const nextCategoryId = useCallback(() => {
    categoryIdCounter.current += 1;
    return `cat-${Date.now()}-${categoryIdCounter.current}`;
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
  }, []);

  const fetchProjectCategories = useCallback(async () => {
    const res = await fetch("/api/project-categories");
    const data = await res.json();
    setProjectCategories(Array.isArray(data) ? data : []);
    setCategoriesDirty(false);
  }, []);

  useEffect(() => {
    void Promise.all([fetchProjects(), fetchProjectCategories()]);
  }, [fetchProjects, fetchProjectCategories]);

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setFormData({ ...emptyProject, order: projects.length + 1, categories: [], category: "" });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    const normalizedCategories = normalizeFormCategories(project.categories, project.category);

    setEditing(project);
    setIsNew(false);
    setFormData({
      title: project.title,
      category: normalizedCategories[0] || "",
      categories: normalizedCategories,
      description: project.description,
      thumbnail: project.thumbnail,
      thumbnailFocusX: Number.isFinite(project.thumbnailFocusX)
        ? Math.min(100, Math.max(0, Number(project.thumbnailFocusX)))
        : 50,
      thumbnailFocusY: Number.isFinite(project.thumbnailFocusY)
        ? Math.min(100, Math.max(0, Number(project.thumbnailFocusY)))
        : 50,
      thumbnailZoom: Number.isFinite(project.thumbnailZoom)
        ? Math.min(3, Math.max(1, Number(project.thumbnailZoom)))
        : 1,
      gallery: project.gallery,
      links: project.links,
      order: project.order,
    });
    setShowForm(true);
  };

  const saveProjectCategories = async () => {
    setSavingCategories(true);
    setCategoriesSaved(false);

    const payload = reindexCategories(projectCategories).map((category) => ({
      id: category.id,
      label: category.label.trim(),
      order: category.order,
    }));

    const res = await fetch("/api/project-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const savedCategories = await res.json();
      setProjectCategories(Array.isArray(savedCategories) ? savedCategories : []);
      setCategoriesDirty(false);
      setCategoriesSaved(true);
      setTimeout(() => setCategoriesSaved(false), 2000);
      await fetchProjects();
    }

    setSavingCategories(false);
  };

  const handleSave = async () => {
    const url = isNew ? "/api/projects" : `/api/projects/${editing!.id}`;
    const method = isNew ? "POST" : "PUT";
    const categories = normalizeFormCategories(formData.categories, formData.category);
    const payload = {
      ...formData,
      categories,
      category: categories[0] || "",
      thumbnail: formData.thumbnail?.trim() || DEFAULT_PROJECT_THUMBNAIL,
    };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowForm(false);
    await fetchProjects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await fetchProjects();
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

  const toggleProjectCategory = (label: string) => {
    setFormData((prev) => {
      const selected = normalizeFormCategories(prev.categories, prev.category);
      const target = label.toLowerCase();
      const exists = selected.some((item) => item.toLowerCase() === target);
      const nextCategories = exists
        ? selected.filter((item) => item.toLowerCase() !== target)
        : [...selected, label];

      return {
        ...prev,
        categories: nextCategories,
        category: nextCategories[0] || "",
      };
    });
  };

  const addProjectCategory = () => {
    const next = reindexCategories([
      ...projectCategories,
      {
        id: nextCategoryId(),
        label: "",
        order: projectCategories.length + 1,
      },
    ]);

    setProjectCategories(next);
    setCategoriesDirty(true);
  };

  const updateProjectCategoryLabel = (id: string, label: string) => {
    const previous = projectCategories.find((category) => category.id === id);
    const previousLabel = previous?.label || "";

    const nextCategories = reindexCategories(
      projectCategories.map((category) =>
        category.id === id ? { ...category, label } : category
      )
    );

    setProjectCategories(nextCategories);
    setCategoriesDirty(true);

    if (previousLabel && previousLabel !== label) {
      setFormData((prev) => {
        const nextSelected = prev.categories.map((item) =>
          item === previousLabel ? label : item
        );

        return {
          ...prev,
          categories: nextSelected,
          category: nextSelected[0] || "",
        };
      });
    }
  };

  const removeProjectCategory = (id: string) => {
    const removed = projectCategories.find((category) => category.id === id);
    if (!removed) return;

    const nextCategories = reindexCategories(
      projectCategories.filter((category) => category.id !== id)
    );

    setProjectCategories(nextCategories);
    setCategoriesDirty(true);

    setFormData((prev) => {
      const nextSelected = prev.categories.filter((item) => item !== removed.label);
      return {
        ...prev,
        categories: nextSelected,
        category: nextSelected[0] || "",
      };
    });

    setProjects((prev) =>
      prev.map((project) => {
        const normalizedCategories = normalizeFormCategories(project.categories, project.category)
          .filter((label) => label !== removed.label);

        return {
          ...project,
          categories: normalizedCategories,
          category: normalizedCategories[0] || "",
        };
      })
    );
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projectCategories.findIndex((category) => category.id === active.id);
    const newIndex = projectCategories.findIndex((category) => category.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(projectCategories, oldIndex, newIndex);
    setProjectCategories(reindexCategories(reordered));
    setCategoriesDirty(true);
  };

  const sortedProjectCategories = [...projectCategories].sort((a, b) => a.order - b.order);
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <Button size="admin" onClick={openNew}>
          <span className="flex items-center gap-2"><FaPlus size={12} /> Add Project</span>
        </Button>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Category Manager</h2>
          <div className="flex items-center gap-2">
            {categoriesSaved && <span className="text-sm text-year-green">Saved!</span>}
            <Button size="admin" variant="outline" onClick={addProjectCategory}>
              <span className="flex items-center gap-2">
                <FaPlus size={10} /> Add Category
              </span>
            </Button>
            <Button
              size="admin"
              onClick={saveProjectCategories}
              disabled={savingCategories || !categoriesDirty}
            >
              <span className="flex items-center gap-2">
                <FaSave size={12} /> {savingCategories ? "Saving..." : "Save Categories"}
              </span>
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={sortedProjectCategories.map((category) => category.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedProjectCategories.map((category) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  onChangeLabel={updateProjectCategoryLabel}
                  onRemove={removeProjectCategory}
                />
              ))}
              {sortedProjectCategories.length === 0 && (
                <p className="text-sm text-text-muted">No categories yet. Add one to get started.</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

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
            {sortedProjects.map((project) => (
              <tr key={project.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors">
                <td className="px-6 py-4 text-sm text-text-primary">{project.title}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{projectCategoryLabel(project)}</td>
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
              <Input type="number" placeholder="Order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })} />
            </div>

            <div>
              <label className="block text-sm text-text-muted mb-2 uppercase tracking-wider">Categories</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border-subtle bg-bg-input p-3">
                {sortedProjectCategories.map((category) => {
                  const label = category.label.trim();
                  if (!label) return null;
                  const isSelected = formData.categories.some(
                    (item) => item.toLowerCase() === label.toLowerCase()
                  );

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleProjectCategory(label)}
                      className={`pill-button text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-accent-purple text-white"
                          : "border border-border-subtle text-text-muted hover:text-text-primary hover:border-accent-purple/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {sortedProjectCategories.length === 0 && (
                  <p className="text-sm text-text-muted">Create categories above to assign them to projects.</p>
                )}
              </div>
            </div>

            <RichTextEditor
              label="Description"
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
            />

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
                        const gallery = [...formData.gallery];
                        gallery[i] = path;
                        setFormData({ ...formData, gallery });
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-muted">Links</label>
                <button type="button" onClick={addLink} className="text-xs text-accent-purple hover:text-accent-magenta cursor-pointer">+ Add Link</button>
              </div>
              <div className="space-y-2">
                {formData.links.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Label" value={link.label} onChange={(e) => {
                      const links = [...formData.links];
                      links[i] = { ...links[i], label: e.target.value };
                      setFormData({ ...formData, links });
                    }} />
                    <Input placeholder="URL" value={link.url} onChange={(e) => {
                      const links = [...formData.links];
                      links[i] = { ...links[i], url: e.target.value };
                      setFormData({ ...formData, links });
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

