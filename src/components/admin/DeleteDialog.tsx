"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDialog({ isOpen, title, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md">
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Item</h3>
        <p className="text-sm text-text-secondary mb-6">
          Are you sure you want to delete <strong className="text-text-primary">{title}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="admin" variant="outline" onClick={onCancel}>Cancel</Button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
