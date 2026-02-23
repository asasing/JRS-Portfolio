"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Project, ProjectCategory } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import DeleteDialog from "@/components/admin/DeleteDialog";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import {
  collectProjectFilePreviews,
  collectProjectImagePreviews,
  collectProjectLinkPreviews,
  normalizeUrlForOpen,
} from "@/lib/admin-preview";
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
  FaImage,
  FaCheck,
  FaPaperclip,
  FaExternalLinkAlt,
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
  attachments: [],
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

function dedupePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

function normalizeProjectMedia(gallery: string[], thumbnail: string): { gallery: string[]; thumbnail: string } {
  const nextGallery = dedupePaths(gallery);
  const cleanThumbnail = thumbnail.trim();

  if (nextGallery.length === 0) {
    return {
      gallery: [],
      thumbnail: cleanThumbnail || DEFAULT_PROJECT_THUMBNAIL,
    };
  }

  if (cleanThumbnail && nextGallery.some((item) => item.toLowerCase() === cleanThumbnail.toLowerCase())) {
    return {
      gallery: nextGallery,
      thumbnail: cleanThumbnail,
    };
  }

  return {
    gallery: nextGallery,
    thumbnail: nextGallery[0],
  };
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

function reindexProjects(projects: Project[]): Project[] {
  return projects.map((project, index) => ({
    ...project,
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

interface SortableProjectRowProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function SortableProjectRow({ project, onEdit, onDelete }: SortableProjectRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });
  const imagePreviews = collectProjectImagePreviews(project);
  const filePreviews = collectProjectFilePreviews(project);
  const linkPreviews = collectProjectLinkPreviews(project);
  const firstImage = imagePreviews[0];
  const firstFile = filePreviews[0];
  const firstLink = linkPreviews[0];

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
        aria-label="Drag to reorder project"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>

      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{project.title}</p>
        <p className="text-xs text-text-muted mt-1 truncate">{projectCategoryLabel(project)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {firstImage ? (
            <div className="admin-mini-thumb relative">
              <Image src={firstImage} alt={`${project.title} preview`} fill className="object-cover" sizes="32px" />
            </div>
          ) : (
            <span className="admin-mini-thumb inline-flex items-center justify-center text-[10px] text-text-muted">N/A</span>
          )}
          <span className="admin-meta-chip">🖼 {imagePreviews.length}</span>
          <span className="admin-meta-chip">📄 {filePreviews.length}</span>
          <span className="admin-meta-chip">🔗 {linkPreviews.length}</span>
          {!firstImage && !firstFile && !firstLink && (
            <span className="text-[11px] text-text-muted">No media/links</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {firstImage && (
            <a
              href={firstImage}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-preview-row"
            >
              Open image
            </a>
          )}
          {firstFile && (
            <a
              href={firstFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-preview-row"
            >
              Open file
            </a>
          )}
          {firstLink && (
            <a
              href={firstLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-preview-row"
            >
              Open link
            </a>
          )}
        </div>
      </div>

      <span className="text-xs text-text-muted">#{project.order}</span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(project)}
          className="text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
        >
          <FaEdit size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(project)}
          className="text-text-muted hover:text-accent-pink transition-colors cursor-pointer"
        >
          <FaTrash size={14} />
        </button>
      </div>
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
  const [savingProjectOrder, setSavingProjectOrder] = useState(false);
  const [projectOrderSaved, setProjectOrderSaved] = useState(false);
  const [projectOrderDirty, setProjectOrderDirty] = useState(false);
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
    setProjectOrderDirty(false);
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
    setFormData({
      ...emptyProject,
      order: projects.length + 1,
      categories: [],
      category: "",
      gallery: [],
      thumbnail: DEFAULT_PROJECT_THUMBNAIL,
    });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    const normalizedCategories = normalizeFormCategories(project.categories, project.category);
    const normalizedMedia = normalizeProjectMedia(project.gallery, project.thumbnail || "");

    setEditing(project);
    setIsNew(false);
    setFormData({
      title: project.title,
      category: normalizedCategories[0] || "",
      categories: normalizedCategories,
      description: project.description,
      thumbnail: normalizedMedia.thumbnail,
      thumbnailFocusX: 50,
      thumbnailFocusY: 50,
      thumbnailZoom: 1,
      gallery: normalizedMedia.gallery,
      attachments: Array.isArray(project.attachments) ? project.attachments : [],
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

  const saveProjectOrder = async () => {
    setSavingProjectOrder(true);
    setProjectOrderSaved(false);

    const orderedIds = [...projects]
      .sort((a, b) => a.order - b.order)
      .map((project) => project.id);

    const res = await fetch("/api/projects/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });

    if (res.ok) {
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
      setProjectOrderDirty(false);
      setProjectOrderSaved(true);
      setTimeout(() => setProjectOrderSaved(false), 2000);
    }

    setSavingProjectOrder(false);
  };

  const handleSave = async () => {
    const url = isNew ? "/api/projects" : `/api/projects/${editing!.id}`;
    const method = isNew ? "POST" : "PUT";
    const categories = normalizeFormCategories(formData.categories, formData.category);
    const media = normalizeProjectMedia(formData.gallery, formData.thumbnail || "");

    const payload = {
      ...formData,
      categories,
      category: categories[0] || "",
      gallery: media.gallery,
      thumbnail: media.thumbnail,
      order: isNew ? projects.length + 1 : editing?.order ?? formData.order,
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

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
    const oldIndex = sortedProjects.findIndex((project) => project.id === active.id);
    const newIndex = sortedProjects.findIndex((project) => project.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedProjects, oldIndex, newIndex);
    setProjects(reindexProjects(reordered));
    setProjectOrderDirty(true);
  };

  const appendGalleryImages = (paths: string[]) => {
    setFormData((prev) => {
      const merged = dedupePaths([...prev.gallery, ...paths]);
      const hasValidThumbnail = merged.some(
        (item) => item.toLowerCase() === (prev.thumbnail || "").trim().toLowerCase()
      );

      return {
        ...prev,
        gallery: merged,
        thumbnail: hasValidThumbnail ? prev.thumbnail : merged[0] || DEFAULT_PROJECT_THUMBNAIL,
      };
    });
  };

  const setThumbnailFromGallery = (path: string) => {
    setFormData((prev) => ({ ...prev, thumbnail: path }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => {
      const removed = prev.gallery[index];
      const nextGallery = prev.gallery.filter((_, idx) => idx !== index);
      const nextThumbnail =
        removed === prev.thumbnail
          ? nextGallery[0] || DEFAULT_PROJECT_THUMBNAIL
          : prev.thumbnail;

      return {
        ...prev,
        gallery: nextGallery,
        thumbnail: nextThumbnail,
      };
    });
  };

  const sortedProjectCategories = [...projectCategories].sort((a, b) => a.order - b.order);
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
  const formImagePreviews = collectProjectImagePreviews(formData);
  const formFilePreviews = collectProjectFilePreviews(formData);
  const formLinkPreviews = collectProjectLinkPreviews(formData);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <Button size="admin" onClick={openNew}>
          <span className="flex items-center gap-2"><FaPlus size={12} /> Add Project</span>
        </Button>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Category Manager</h2>
          <div className="flex flex-wrap items-center gap-2">
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

      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Project Order</h2>
          <div className="flex items-center gap-2">
            {projectOrderSaved && <span className="text-sm text-year-green">Saved!</span>}
            <Button
              size="admin"
              onClick={saveProjectOrder}
              disabled={savingProjectOrder || !projectOrderDirty}
            >
              <span className="flex items-center gap-2">
                <FaSave size={12} /> {savingProjectOrder ? "Saving..." : "Save Project Order"}
              </span>
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleProjectDragEnd}
        >
          <SortableContext
            items={sortedProjects.map((project) => project.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedProjects.map((project) => (
                <SortableProjectRow
                  key={project.id}
                  project={project}
                  onEdit={openEdit}
                  onDelete={(item) => setDeleteTarget(item)}
                />
              ))}
              {sortedProjects.length === 0 && (
                <p className="text-sm text-text-muted">No projects yet.</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
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
            <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />

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

            <MultiImageUploader
              label="Project Images"
              category="projects"
              onUploadComplete={appendGalleryImages}
            />

            <div>
              <label className="block text-sm text-text-muted mb-2">Gallery and Thumbnail Selection</label>
              {formData.gallery.length === 0 ? (
                <p className="rounded-lg border border-border-subtle bg-bg-input px-4 py-3 text-sm text-text-muted">
                  Upload images above to build gallery and choose a thumbnail.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.gallery.map((path, index) => {
                    const isThumbnail = path === formData.thumbnail;

                    return (
                      <div key={`${path}-${index}`} className="rounded-xl border border-border-subtle bg-bg-input p-3">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-card">
                          <Image
                            src={path}
                            alt={`Project image ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setThumbnailFromGallery(path)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors cursor-pointer ${
                              isThumbnail
                                ? "bg-accent-purple text-white"
                                : "border border-border-subtle text-text-muted hover:text-accent-purple hover:border-accent-purple"
                            }`}
                          >
                            {isThumbnail ? <FaCheck size={11} /> : <FaImage size={11} />}
                            {isThumbnail ? "Thumbnail" : "Set as Thumbnail"}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="text-xs text-text-muted hover:text-accent-pink cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <p className="mt-2 truncate text-[11px] text-text-muted">{path}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-text-muted">Links</label>
                <button type="button" onClick={addLink} className="text-xs text-accent-purple hover:text-accent-magenta cursor-pointer">+ Add Link</button>
              </div>
              <div className="space-y-2">
                {formData.links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
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
                    {normalizeUrlForOpen(link.url) ? (
                      <a
                        href={normalizeUrlForOpen(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-preview-row shrink-0"
                      >
                        <FaExternalLinkAlt size={10} />
                        Open
                      </a>
                    ) : (
                      <span className="admin-preview-row shrink-0 opacity-40" aria-disabled="true">
                        <FaExternalLinkAlt size={10} />
                        Open
                      </span>
                    )}
                    <button onClick={() => removeLink(i)} className="text-text-muted hover:text-accent-pink cursor-pointer px-2">
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-input p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">Preview</h3>

              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Image Preview</p>
                {formImagePreviews.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {formImagePreviews.slice(0, 3).map((path, index) => (
                      <a
                        key={`${path}-${index}`}
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-mini-thumb relative"
                        title="Open image"
                      >
                        <Image src={path} alt={`Preview image ${index + 1}`} fill className="object-cover" sizes="32px" />
                      </a>
                    ))}
                    <span className="admin-meta-chip">🖼 {formImagePreviews.length}</span>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No images attached</p>
                )}
              </div>

              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">File Preview</p>
                {formFilePreviews.length > 0 ? (
                  <div className="space-y-1">
                    {formFilePreviews.map((attachment) => (
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

              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Link Preview</p>
                {formLinkPreviews.length > 0 ? (
                  <div className="space-y-1">
                    {formLinkPreviews.map((link, index) => (
                      <a
                        key={`${link.url}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-preview-row w-fit"
                      >
                        <FaExternalLinkAlt size={10} />
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No links attached</p>
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

      <DeleteDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
