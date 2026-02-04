"use client";

import { useEffect, useRef, useState } from "react";

export type Material = {
  id: string;
  title: string;
  type: string;
  link: string;
  created_at?: string;
  sort_order?: number | null;
};

type MaterialCardProps = {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  dragging?: boolean;
};

export default function MaterialCard({
  material,
  onEdit,
  onDelete,
  dragging
}: MaterialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      className="card-node"
      role="group"
    >
      <div className="card-meta" ref={menuRef}>
        <span className="card-badge">{material.type}</span>
        <div className="card-menu">
          <button
            className="card-menu-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Card actions"
            onMouseDown={(event) => event.stopPropagation()}
          >
            ···
          </button>
          {menuOpen && (
            <div className="card-menu-panel">
              <button
                className="card-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(material);
                }}
              >
                Edit
              </button>
              <button
                className="card-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(material);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="card-header">
        <a
          className="card-title card-link"
          href={material.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            if (!dragging) return;
            event.preventDefault();
          }}
        >
          {material.title}
        </a>
      </div>
    </div>
  );
}
