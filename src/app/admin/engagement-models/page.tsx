"use client";

import { useCallback, useEffect, useState } from "react";
import { EngagementModel } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
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
import { FaGripVertical, FaPlus, FaSave, FaTimes } from "react-icons/fa";

function reindexModels(models: EngagementModel[]): EngagementModel[] {
  return models.map((model, index) => ({ ...model, order: index + 1 }));
}

interface SortableModelRowProps {
  model: EngagementModel;
  onChange: (id: string, field: keyof EngagementModel, value: string) => void;
  onRemove: (id: string) => void;
}

function SortableModelRow({ model, onChange, onRemove }: SortableModelRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: model.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border-subtle bg-bg-card p-5 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button
            type="button"
            aria-label="Drag to reorder engagement model"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <FaGripVertical size={12} />
          </button>
          <span>Option {String(model.order).padStart(2, "0")}</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(model.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-pink cursor-pointer"
          aria-label="Remove model"
        >
          <FaTimes size={11} />
        </button>
      </div>

      <div className="space-y-3">
        <Input
          label="Title"
          value={model.title}
          onChange={(event) => onChange(model.id, "title", event.target.value)}
        />
        <Textarea
          label="Description"
          value={model.description}
          onChange={(event) =>
            onChange(model.id, "description", event.target.value)
          }
        />
      </div>
    </div>
  );
}

export default function AdminEngagementModels() {
  const [models, setModels] = useState<EngagementModel[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchModels = useCallback(async () => {
    const res = await fetch("/api/engagement-models");
    const data = (await res.json()) as EngagementModel[];
    const normalized = Array.isArray(data) ? data : [];
    setModels([...normalized].sort((a, b) => a.order - b.order));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchModels();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchModels]);

  const addModel = () => {
    setModels((prev) =>
      reindexModels([
        ...prev,
        {
          id: `engagement-model-${Date.now()}`,
          title: "",
          description: "",
          order: prev.length + 1,
        },
      ])
    );
    setSaved(false);
  };

  const removeModel = (id: string) => {
    setModels((prev) => reindexModels(prev.filter((model) => model.id !== id)));
    setSaved(false);
  };

  const updateModel = (
    id: string,
    field: keyof EngagementModel,
    value: string
  ) => {
    setModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, [field]: value } : model))
    );
    setSaved(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = models.findIndex((model) => model.id === active.id);
    const newIndex = models.findIndex((model) => model.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setModels((prev) => reindexModels(arrayMove(prev, oldIndex, newIndex)));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = reindexModels(models).map((model) => ({
      ...model,
      title: model.title.trim(),
      description: model.description.trim(),
    }));
    await fetch("/api/engagement-models", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchModels();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Engagement Models</h1>
        <div className="flex flex-wrap items-center gap-3">
          {saved && <span className="text-sm text-year-green">Saved!</span>}
          <Button size="admin" variant="outline" onClick={addModel}>
            <span className="flex items-center gap-2">
              <FaPlus size={10} /> Add Model
            </span>
          </Button>
          <Button size="admin" onClick={handleSave} disabled={saving}>
            <span className="flex items-center gap-2">
              <FaSave size={12} /> {saving ? "Saving..." : "Save All"}
            </span>
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={models.map((model) => model.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {models.map((model) => (
              <SortableModelRow
                key={model.id}
                model={model}
                onChange={updateModel}
                onRemove={removeModel}
              />
            ))}
            {models.length === 0 && (
              <p className="text-sm text-text-muted">No engagement models yet.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
