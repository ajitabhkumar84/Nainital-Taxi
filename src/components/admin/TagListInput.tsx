"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface TagListInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

// Small reusable "add a chip, remove a chip" list editor, styled after the
// tag-input pattern already used in PackageForm.tsx (includes/excludes).
export default function TagListInput({ label, value, onChange, placeholder }: TagListInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    if (draft.trim()) {
      onChange([...value, draft.trim()]);
      setDraft("");
    }
  };

  return (
    <div>
      <label className="block font-body text-sm text-ink/70 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-3 py-1 bg-teal/10 border-2 border-teal rounded-full font-body text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="hover:text-coral"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border-2 border-ink/20 rounded-lg font-body focus:border-teal focus:outline-none"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 bg-teal/10 border-2 border-teal rounded-lg font-body text-sm hover:bg-teal/20"
        >
          Add
        </button>
      </div>
    </div>
  );
}
