"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, Editor, useEditor } from "@tiptap/react";
import { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaLink,
  FaUnlink,
  FaImage,
} from "react-icons/fa";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  allowHeadings?: boolean;
  allowImage?: boolean;
  allowLinks?: boolean;
  minHeightClassName?: string;
}

interface ToolbarButtonProps {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-accent-purple bg-accent-purple/20 text-accent-purple"
          : "border-border-subtle text-text-secondary hover:border-accent-purple hover:text-accent-purple"
      }`}
    >
      {children}
    </button>
  );
}

function isHtmlEqual(left: string, right: string): boolean {
  return left.trim() === right.trim();
}

function HeadingButtons({ editor }: { editor: Editor }) {
  const makeHeadingHandler =
    (level: 1 | 2 | 3) => () =>
      editor.chain().focus().toggleHeading({ level }).run();

  return (
    <>
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={makeHeadingHandler(1)}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={makeHeadingHandler(2)}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={makeHeadingHandler(3)}
      >
        H3
      </ToolbarButton>
    </>
  );
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  allowHeadings = true,
  allowImage = true,
  allowLinks = true,
  minHeightClassName = "min-h-48",
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorClassName = `${minHeightClassName} w-full rounded-lg border border-border-subtle bg-bg-input px-4 py-3 text-sm text-text-primary focus:outline-none`;

  const extensions: AnyExtension[] = [
    StarterKit.configure({
      heading: allowHeadings ? { levels: [1, 2, 3] } : false,
    }),
    Underline,
  ];

  if (allowLinks) {
    extensions.push(
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
      })
    );
  }

  if (allowImage) {
    extensions.push(
      Image.configure({
        allowBase64: false,
      })
    );
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: `bio-editor-content ${editorClassName}`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "<p></p>";
    if (!isHtmlEqual(current, next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor || !allowLinks) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;

    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const handleImageUpload = async (file: File) => {
    if (!editor || !allowImage) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "bio");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Image upload failed.");
      }

      const data = (await res.json()) as { path?: string };
      if (data.path) {
        editor
          .chain()
          .focus()
          .setImage({ src: data.path, alt: file.name })
          .run();
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-muted mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {editor && (
          <div className="flex flex-wrap gap-2 rounded-lg border border-border-subtle bg-bg-input p-2">
            <ToolbarButton
              title="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <FaBold size={12} />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <FaItalic size={12} />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <FaUnderline size={12} />
            </ToolbarButton>

            {allowHeadings && <HeadingButtons editor={editor} />}

            <ToolbarButton
              title="Bullet List"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <FaListUl size={12} />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered List"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <FaListOl size={12} />
            </ToolbarButton>
            <ToolbarButton
              title="Blockquote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <FaQuoteRight size={12} />
            </ToolbarButton>
            {allowLinks && (
              <>
                <ToolbarButton title="Insert Link" onClick={setLink}>
                  <FaLink size={12} />
                </ToolbarButton>
                <ToolbarButton
                  title="Remove Link"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  <FaUnlink size={12} />
                </ToolbarButton>
              </>
            )}
            {allowImage && (
              <ToolbarButton
                title={uploading ? "Uploading..." : "Insert Image"}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaImage size={12} />
              </ToolbarButton>
            )}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      {allowImage && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      )}
    </div>
  );
}
