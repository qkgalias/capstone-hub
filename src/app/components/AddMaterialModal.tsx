"use client";

import { useEffect, useState } from "react";
import type { Material } from "./MaterialCard";

type MaterialInput = Omit<Material, "id" | "created_at" | "sort_order">;

type AddMaterialModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MaterialInput) => void;
  initialData?: Material | null;
  typeOptions: string[];
};

export default function AddMaterialModal({
  open,
  onClose,
  onSubmit,
  initialData,
  typeOptions
}: AddMaterialModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(typeOptions[0] || "");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setType(initialData.type);
      setLink(initialData.link);
      return;
    }

    setTitle("");
    setType(typeOptions[0] || "");
    setLink("");
  }, [initialData, typeOptions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0b132b]/70 px-8 py-8 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[0.04em] text-gray-100">
            {initialData ? "Edit material" : "Add new material"}
          </h2>
          <button
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs tracking-[0.04em] text-gray-300 hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <form
          className="mt-6 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ title, type, link });
          }}
        >
          <label className="grid gap-2 text-sm tracking-[0.04em] text-gray-400 font-light">
            Title
            <input
              className="w-full rounded-md border border-white/10 bg-slate-800 px-4 py-3 text-base text-gray-200 focus:outline-none focus:ring-1 focus:ring-white/30"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="System Flowchart"
              required
            />
          </label>
          <label className="grid gap-2 text-sm tracking-[0.04em] text-gray-400 font-light">
            Category
            <select
              className="w-full rounded-md border border-white/10 bg-slate-800 px-4 py-3 text-base text-gray-200 focus:outline-none focus:ring-1 focus:ring-white/30"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm tracking-[0.04em] text-gray-400 font-light">
            External link
            <input
              className="w-full rounded-md border border-white/10 bg-slate-800 px-4 py-3 text-base text-gray-200 focus:outline-none focus:ring-1 focus:ring-white/30"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://"
              type="url"
              required
            />
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md border border-white/10 px-4 py-2 text-sm tracking-[0.04em] text-gray-300 hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-white/10 px-4 py-2 text-sm tracking-[0.04em] text-gray-200 hover:bg-white/5"
            >
              {initialData ? "Save changes" : "Add material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
