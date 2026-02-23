"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { FaSave, FaTimes, FaPlus, FaGripVertical } from "react-icons/fa";
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

const emptyProfile: Profile = {
  name: "", tagline: "", bio: "", profilePhoto: "",
  experienceStartYear: 2018,
  profilePhotoFocusX: 50,
  profilePhotoFocusY: 50,
  profilePhotoZoom: 1,
  skills: [], stats: [], socials: [], email: "", phone: "",
  favicon: "",
};

const normalizeProfile = (raw: Partial<Profile>): Profile => ({
  ...emptyProfile,
  ...raw,
  experienceStartYear:
    Number.isFinite(raw.experienceStartYear) && Number(raw.experienceStartYear) > 0
      ? Number(raw.experienceStartYear)
      : 2018,
  profilePhotoFocusX:
    Number.isFinite(raw.profilePhotoFocusX)
      ? Math.min(100, Math.max(0, Number(raw.profilePhotoFocusX)))
      : 50,
  profilePhotoFocusY:
    Number.isFinite(raw.profilePhotoFocusY)
      ? Math.min(100, Math.max(0, Number(raw.profilePhotoFocusY)))
      : 50,
  profilePhotoZoom:
    Number.isFinite(raw.profilePhotoZoom)
      ? Math.min(3, Math.max(1, Number(raw.profilePhotoZoom)))
      : 1,
  skills: Array.isArray(raw.skills) ? raw.skills : [],
  stats: Array.isArray(raw.stats) ? raw.stats : [],
  socials: Array.isArray(raw.socials) ? raw.socials : [],
});

interface SortableSkillRowProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function SortableSkillRow({ id, value, onChange, onRemove }: SortableSkillRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
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
        aria-label="Drag to reorder skill"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-purple cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Skill name"
        className="h-9 w-full rounded-md border border-border-subtle bg-bg-card px-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple"
      />

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted hover:text-accent-pink cursor-pointer"
        aria-label="Remove skill"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const skillIdCounter = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const nextSkillId = useCallback(() => {
    skillIdCounter.current += 1;
    return `skill-${Date.now()}-${skillIdCounter.current}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const res = await fetch("/api/profile");
      const data = (await res.json()) as Partial<Profile>;
      if (cancelled) return;

      const normalized = normalizeProfile(data);
      setProfile(normalized);
      setSkillIds(normalized.skills.map(() => nextSkillId()));
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [nextSkillId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSkill = () => {
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, ""] }));
    setSkillIds((prev) => [...prev, nextSkillId()]);
    setSaved(false);
  };

  const updateSkill = (index: number, value: string) => {
    setProfile((prev) => {
      const next = [...prev.skills];
      next[index] = value;
      return { ...prev, skills: next };
    });
    setSaved(false);
  };

  const removeSkill = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== index),
    }));
    setSkillIds((prev) => prev.filter((_, idx) => idx !== index));
    setSaved(false);
  };

  const handleSkillDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = skillIds.indexOf(String(active.id));
    const newIndex = skillIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    setSkillIds((prev) => arrayMove(prev, oldIndex, newIndex));
    setProfile((prev) => ({
      ...prev,
      skills: arrayMove(prev.skills, oldIndex, newIndex),
    }));
    setSaved(false);
  };

  const addStat = () => {
    setProfile((prev) => ({ ...prev, stats: [...prev.stats, { label: "", value: "" }] }));
    setSaved(false);
  };

  const addSocial = () => {
    setProfile((prev) => ({
      ...prev,
      socials: [...prev.socials, { platform: "", url: "", icon: "FaGlobe" }],
    }));
    setSaved(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-year-green">Saved!</span>}
          <Button size="admin" onClick={handleSave} disabled={saving}>
            <span className="flex items-center gap-2">
              <FaSave size={12} /> {saving ? "Saving..." : "Save Profile"}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Info</h2>
          <Input label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Tagline" value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} />
          <RichTextEditor label="Bio" value={profile.bio} onChange={(bio) => setProfile({ ...profile, bio })} />
          <Input
            type="number"
            label="Experience Start Year"
            value={profile.experienceStartYear}
            onChange={(e) =>
              setProfile({
                ...profile,
                experienceStartYear: Number.parseInt(e.target.value, 10) || 2018,
              })
            }
          />
          <Input label="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>

        {/* Profile Photo */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Photo</h2>
            <ImageUploader
              value={profile.profilePhoto}
              category="profile"
              enablePositioning
              focusX={profile.profilePhotoFocusX}
              focusY={profile.profilePhotoFocusY}
              zoom={profile.profilePhotoZoom}
              onFocusChange={(x, y, zoom) =>
                setProfile({
                  ...profile,
                  profilePhotoFocusX: x,
                  profilePhotoFocusY: y,
                  profilePhotoZoom: zoom,
                })
              }
              onChange={(path) =>
                setProfile({
                  ...profile,
                  profilePhoto: path,
                  ...(path
                    ? {}
                    : { profilePhotoFocusX: 50, profilePhotoFocusY: 50, profilePhotoZoom: 1 }),
                })
              }
            />
          </div>

          {/* Favicon / Browser Tab Icon */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Browser Tab Icon</h2>
            <ImageUploader
              value={profile.favicon || ""}
              category="profile"
              onChange={(path) => setProfile({ ...profile, favicon: path })}
            />
            <p className="text-xs text-text-muted mt-3">
              Recommended: PNG or SVG, 32&times;32 or 180&times;180 pixels.
            </p>
          </div>

          {/* Skills */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">Skills</h2>
              <Button size="admin" variant="outline" onClick={addSkill} className="shrink-0">
                <span className="flex items-center gap-2">
                  <FaPlus size={10} /> Add Skill
                </span>
              </Button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSkillDragEnd}
            >
              <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {skillIds.map((id, index) => (
                    <SortableSkillRow
                      key={id}
                      id={id}
                      value={profile.skills[index] || ""}
                      onChange={(value) => updateSkill(index, value)}
                      onRemove={() => removeSkill(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Stats</h2>
            <button onClick={addStat} className="text-sm text-accent-purple hover:text-accent-magenta cursor-pointer flex items-center gap-1">
              <FaPlus size={10} /> Add Stat
            </button>
          </div>
          <div className="space-y-3">
            {profile.stats.map((stat, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Label" value={stat.label} onChange={(e) => {
                  const s = [...profile.stats]; s[i] = { ...s[i], label: e.target.value };
                  setProfile({ ...profile, stats: s });
                }} />
                <Input placeholder="Value" value={stat.value} onChange={(e) => {
                  const s = [...profile.stats]; s[i] = { ...s[i], value: e.target.value };
                  setProfile({ ...profile, stats: s });
                }} />
                <button onClick={() => setProfile({ ...profile, stats: profile.stats.filter((_, idx) => idx !== i) })} className="text-text-muted hover:text-accent-pink cursor-pointer px-2">
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Social Links</h2>
            <button onClick={addSocial} className="text-sm text-accent-purple hover:text-accent-magenta cursor-pointer flex items-center gap-1">
              <FaPlus size={10} /> Add Social
            </button>
          </div>
          <div className="space-y-3">
            {profile.socials.map((social, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Platform" value={social.platform} onChange={(e) => {
                  const s = [...profile.socials]; s[i] = { ...s[i], platform: e.target.value };
                  setProfile({ ...profile, socials: s });
                }} />
                <Input placeholder="URL" value={social.url} onChange={(e) => {
                  const s = [...profile.socials]; s[i] = { ...s[i], url: e.target.value };
                  setProfile({ ...profile, socials: s });
                }} />
                <Input placeholder="Icon" value={social.icon} onChange={(e) => {
                  const s = [...profile.socials]; s[i] = { ...s[i], icon: e.target.value };
                  setProfile({ ...profile, socials: s });
                }} />
                <button onClick={() => setProfile({ ...profile, socials: profile.socials.filter((_, idx) => idx !== i) })} className="text-text-muted hover:text-accent-pink cursor-pointer px-2">
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
