"use client";

import { useCallback, useEffect, useState } from "react";
import { PageSection } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { FaEdit, FaEye, FaEyeSlash, FaGripVertical, FaPlus, FaSave, FaTrash } from "react-icons/fa";

interface CustomSectionForm {
  id: string;
  label: string;
  title: string;
  bodyHtml: string;
}

function reindexSections(sections: PageSection[]): PageSection[] {
  return sections.map((section, index) => ({ ...section, order: index + 1 }));
}

interface SortableSectionRowProps {
  section: PageSection;
  onToggleVisibility: (id: string) => void;
  onEditCustom: (section: PageSection) => void;
  onDeleteCustom: (id: string) => void;
}

function SortableSectionRow({
  section,
  onToggleVisibility,
  onEditCustom,
  onDeleteCustom,
}: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border-subtle bg-bg-card px-4 py-3 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder section"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{section.label}</p>
        <p className="mt-1 text-xs text-text-muted">
          {section.isCustom ? "Custom section" : `Built-in (${section.key})`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleVisibility(section.id)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle transition-colors cursor-pointer ${
            section.visible
              ? "text-year-green hover:text-accent-purple"
              : "text-text-muted hover:text-accent-purple"
          }`}
          aria-label={section.visible ? "Hide section" : "Show section"}
        >
          {section.visible ? <FaEye size={13} /> : <FaEyeSlash size={13} />}
        </button>

        {section.isCustom && (
          <>
            <button
              type="button"
              onClick={() => onEditCustom(section)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
              aria-label="Edit custom section"
            >
              <FaEdit size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCustom(section.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-pink transition-colors cursor-pointer"
              aria-label="Delete custom section"
            >
              <FaTrash size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminSections() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [customForm, setCustomForm] = useState<CustomSectionForm>({
    id: "",
    label: "",
    title: "",
    bodyHtml: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSections = useCallback(async () => {
    const res = await fetch("/api/page-sections");
    const data = (await res.json()) as PageSection[];
    const list = Array.isArray(data) ? data : [];
    setSections([...list].sort((a, b) => a.order - b.order));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSections();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchSections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setSections((prev) => reindexSections(arrayMove(prev, oldIndex, newIndex)));
    setSaved(false);
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
    setSaved(false);
  };

  const openAddCustom = () => {
    const timestamp = Date.now();
    setCustomForm({
      id: `custom-section-${timestamp}`,
      label: "",
      title: "",
      bodyHtml: "",
    });
    setShowForm(true);
  };

  const openEditCustom = (section: PageSection) => {
    setCustomForm({
      id: section.id,
      label: section.label,
      title: section.content?.title || section.label,
      bodyHtml: section.content?.bodyHtml || "",
    });
    setShowForm(true);
  };

  const deleteCustom = (id: string) => {
    setSections((prev) => reindexSections(prev.filter((section) => section.id !== id)));
    setSaved(false);
  };

  const saveCustomSection = () => {
    const trimmedLabel = customForm.label.trim();
    const trimmedTitle = customForm.title.trim();
    const sectionLabel = trimmedLabel || trimmedTitle || "Custom Section";
    const key =
      sections.find((section) => section.id === customForm.id)?.key ||
      `custom-${customForm.id.replace(/^custom-section-/, "")}`;

    const nextSection: PageSection = {
      id: customForm.id,
      key,
      label: sectionLabel,
      order: sections.length + 1,
      visible: true,
      isCustom: true,
      content: {
        title: trimmedTitle || sectionLabel,
        bodyHtml: customForm.bodyHtml,
      },
    };

    setSections((prev) => {
      const existingIndex = prev.findIndex((section) => section.id === customForm.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          label: sectionLabel,
          content: {
            ...(next[existingIndex].content ?? {}),
            title: trimmedTitle || sectionLabel,
            bodyHtml: customForm.bodyHtml,
          },
        };
        return reindexSections(next);
      }
      return reindexSections([...prev, nextSection]);
    });

    setShowForm(false);
    setSaved(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const payload = reindexSections(sections).map((section) => ({
      ...section,
      label: section.label.trim(),
    }));

    await fetch("/api/page-sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchSections();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Sections</h1>
        <div className="flex flex-wrap items-center gap-3">
          {saved && <span className="text-sm text-year-green">Saved!</span>}
          <Button size="admin" variant="outline" onClick={openAddCustom}>
            <span className="flex items-center gap-2">
              <FaPlus size={10} /> Add Custom Section
            </span>
          </Button>
          <Button size="admin" onClick={handleSaveAll} disabled={saving}>
            <span className="flex items-center gap-2">
              <FaSave size={12} /> {saving ? "Saving..." : "Save Order & Visibility"}
            </span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSectionRow
                  key={section.id}
                  section={section}
                  onToggleVisibility={toggleVisibility}
                  onEditCustom={openEditCustom}
                  onDeleteCustom={deleteCustom}
                />
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-text-muted">No sections found.</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {showForm && (
        <div className="mt-6 rounded-xl border border-border-subtle bg-bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            {sections.some((section) => section.id === customForm.id)
              ? "Edit Custom Section"
              : "Add Custom Section"}
          </h2>
          <div className="space-y-4">
            <Input
              label="Menu Label"
              value={customForm.label}
              onChange={(event) =>
                setCustomForm((prev) => ({ ...prev, label: event.target.value }))
              }
            />
            <Input
              label="Section Title"
              value={customForm.title}
              onChange={(event) =>
                setCustomForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <RichTextEditor
              label="Section Body"
              value={customForm.bodyHtml}
              onChange={(value) =>
                setCustomForm((prev) => ({ ...prev, bodyHtml: value }))
              }
            />
            <div className="flex justify-end gap-3">
              <Button size="admin" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="admin" onClick={saveCustomSection}>
                Save Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
