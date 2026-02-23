"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Service } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { FaSave, FaCloudUploadAlt } from "react-icons/fa";

function isImageIcon(icon: string): boolean {
  const value = icon.trim();
  return value.startsWith("/images/") || /^https?:\/\//i.test(value);
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/services");
    setServices(await res.json());
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const updateService = (serviceId: string, field: keyof Service, value: string | number) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    );
    setSaved(false);
  };

  const addService = () => {
    setServices([...services, {
      id: `svc-${Date.now()}`,
      number: `0${services.length + 1}/`,
      title: "",
      description: "",
      icon: "FaCode",
      order: services.length + 1,
    }]);
  };

  const removeService = (serviceId: string) => {
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
    setSaved(false);
  };

  const handleIconUpload = async (serviceId: string, file: File) => {
    setUploadingServiceId(serviceId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "services");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Icon upload failed.");
      }

      const data = (await res.json()) as { path?: string };
      if (data.path) {
        updateService(serviceId, "icon", data.path);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingServiceId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(services),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Services</h1>
        <div className="flex flex-wrap items-center gap-3">
          {saved && <span className="text-sm text-year-green">Saved!</span>}
          <Button size="admin" variant="outline" onClick={addService}>+ Add Service</Button>
          <Button size="admin" onClick={handleSave} disabled={saving}>
            <span className="flex items-center gap-2">
              <FaSave size={12} /> {saving ? "Saving..." : "Save All"}
            </span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {[...services].sort((a, b) => a.order - b.order).map((service) => (
          <div key={service.id} className="bg-bg-card border border-border-subtle rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-lg font-mono text-accent-purple">{service.number}</span>
              <button onClick={() => removeService(service.id)} className="text-xs text-text-muted hover:text-accent-pink cursor-pointer">Remove</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Number (01/)" value={service.number} onChange={(e) => updateService(service.id, "number", e.target.value)} />
              <Input placeholder="Title" value={service.title} onChange={(e) => updateService(service.id, "title", e.target.value)} />
              <Input placeholder="Icon (FaCode or /images/services/...)" value={service.icon} onChange={(e) => updateService(service.id, "icon", e.target.value)} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-subtle text-sm text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors cursor-pointer">
                <FaCloudUploadAlt size={12} />
                {uploadingServiceId === service.id ? "Uploading..." : "Upload Icon"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingServiceId === service.id}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleIconUpload(service.id, file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-text-muted">
                Use a Font Awesome key (e.g. <code>FaCode</code>) or upload an image icon.
              </span>
            </div>

            {isImageIcon(service.icon) && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-text-muted uppercase tracking-wider">Preview</span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-bg-input">
                  <Image
                    src={service.icon}
                    alt={`${service.title || "Service"} icon preview`}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    unoptimized
                  />
                </span>
              </div>
            )}

            <div className="mt-4">
              <Textarea placeholder="Description" value={service.description} onChange={(e) => updateService(service.id, "description", e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
