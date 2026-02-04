"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import AddMaterialModal from "../components/AddMaterialModal";
import MaterialCard, { Material } from "../components/MaterialCard";

const typeOptions = [
  "Documentation",
  "UREC Forms",
  "Questionnaire",
  "System Design",
  "Github Repository",
  "To Do's",
  "Meeting Notes",
  "Other"
];

const typeOrder = [...typeOptions];

export default function DashboardPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, scrollLeft: 0 });

  const groupedMaterials = materials.reduce<Record<string, Material[]>>(
    (acc, material) => {
      const key = material.type || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(material);
      return acc;
    },
    {}
  );

  const groupedEntries = Object.entries(groupedMaterials).sort((a, b) => {
    const aIndex = typeOrder.indexOf(a[0]);
    const bIndex = typeOrder.indexOf(b[0]);
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const maxColumns = Math.min(8, Math.max(1, groupedEntries.length));
  const effectiveColumns = maxColumns;
  const balancedColumns = groupedEntries.reduce<
    { items: [string, Material[]][]; count: number }[]
  >(
    (columns, entry) => {
      const [type, items] = entry;
      const nextIndex = columns
        .map((column, index) => ({ index, count: column.count }))
        .sort((a, b) => a.count - b.count)[0].index;
      columns[nextIndex].items.push([type, items]);
      columns[nextIndex].count += items.length;
      return columns;
    },
    Array.from({ length: effectiveColumns }, () => ({ items: [], count: 0 }))
  );

  const sortedByOrder = (items: Material[]) =>
    [...items].sort((a, b) => {
      const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.created_at || "").localeCompare(b.created_at || "");
    });

  const fetchMaterials = useCallback(
    async (currentUserId: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("materials")
        .select("id,title,type,link,created_at,sort_order")
        .eq("user_id", currentUserId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      setMaterials(data || []);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      setUserId(data.session.user.id);
      fetchMaterials(data.session.user.id);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchMaterials, router]);

  const handleOpenModal = (material?: Material) => {
    setEditingMaterial(material ?? null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSave = async (data: Omit<Material, "id" | "created_at">) => {
    if (!userId) return;

    setSaving(true);
    setStatus(null);

    const nextOrder = (type: string) => {
      const group = materials.filter((item) => item.type === type);
      if (group.length === 0) return 0;
      const maxOrder = Math.max(...group.map((item) => item.sort_order ?? 0));
      return maxOrder + 1;
    };

    if (editingMaterial) {
      const typeChanged = editingMaterial.type !== data.type;
      const updatedPayload = {
        title: data.title,
        type: data.type,
        link: data.link
      } as {
        title: string;
        type: string;
        link: string;
        sort_order?: number;
      };

      if (typeChanged) {
        updatedPayload.sort_order = nextOrder(data.type);
      }

      const { error } = await supabase
        .from("materials")
        .update(updatedPayload)
        .eq("id", editingMaterial.id)
        .eq("user_id", userId);

      if (error) {
        setStatus(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("materials").insert({
        title: data.title,
        type: data.type,
        link: data.link,
        user_id: userId,
        sort_order: nextOrder(data.type)
      });

      if (error) {
        setStatus(error.message);
        setSaving(false);
        return;
      }
    }

    await fetchMaterials(userId);
    setSaving(false);
    handleCloseModal();
  };

  const handleDelete = async (material: Material) => {
    if (!userId) return;

    const confirmed = window.confirm(
      `Delete "${material.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", material.id)
      .eq("user_id", userId);

    if (error) {
      setStatus(error.message);
      return;
    }

    await fetchMaterials(userId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleDragStart = (material: Material) => {
    setDraggingId(material.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".card-menu") || target.closest(".card-link")) {
      return;
    }
    const container = scrollRef.current;
    if (!container) return;
    isPanningRef.current = true;
    panStartRef.current = {
      x: event.clientX,
      scrollLeft: container.scrollLeft
    };
    container.classList.add("is-panning");
  };

  const handlePanMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const container = scrollRef.current;
    if (!container) return;
    const delta = event.clientX - panStartRef.current.x;
    container.scrollLeft = panStartRef.current.scrollLeft - delta;
  };

  const handlePanEnd = () => {
    const container = scrollRef.current;
    if (!container) return;
    isPanningRef.current = false;
    container.classList.remove("is-panning");
  };

  const handleDrop = async (
    sourceId: string,
    targetId: string,
    type: string
  ) => {
    if (sourceId === targetId) return;
    const groupItems = sortedByOrder(
      materials.filter((item) => item.type === type)
    );
    const sourceIndex = groupItems.findIndex((item) => item.id === sourceId);
    const targetIndex = groupItems.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...groupItems];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const updates = reordered.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setMaterials((prev) =>
      prev.map((item) => {
        const updated = updates.find((u) => u.id === item.id);
        return updated ? { ...item, sort_order: updated.sort_order } : item;
      })
    );

    if (!userId) return;
    const updateResults = await Promise.all(
      updates.map((item) =>
        supabase
          .from("materials")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
          .eq("user_id", userId)
      )
    );

    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      setStatus(updateError.message);
    }
  };

  return (
    <div className="min-h-screen px-2 py-16 flex justify-center">
      <div className="w-full max-w-6xl grid gap-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[0.04em]">
              Capstone Materials
            </h1>
            <p className="text-base text-gray-400 mt-2">
              Space for all the dependencies
            </p>
          </div>
          <div className="flex gap-4">
            <button
              className="rounded-md border border-white/15 bg-[#0b132b]/70 px-4 py-2 text-base tracking-[0.04em] text-white hover:bg-[#0b132b]/85 active:scale-[0.99] transition"
              onClick={() => handleOpenModal()}
            >
              Add Material
            </button>
            <button
              className="rounded-md border border-white/15 bg-[#0b132b]/70 px-4 py-2 text-base tracking-[0.04em] text-gray-200 hover:bg-[#0b132b]/85 active:scale-[0.99] transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {status && (
          <p className="text-base text-gray-400 tracking-[0.04em]">{status}</p>
        )}
        {loading && (
          <p className="text-base text-gray-400 tracking-[0.04em]">
            Loading materials...
          </p>
        )}
        {!loading && materials.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <div className="empty-box" />
            </div>
            <p className="empty-title">No materials yet</p>
            <p className="empty-subtitle">
              Add your first link to start building the hub.
            </p>
            <button
              className="empty-action"
              onClick={() => handleOpenModal()}
            >
              Add First Material
            </button>
          </div>
        )}

        {!loading && materials.length > 0 && (
          <div
            className="tree-scroll"
            ref={scrollRef}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <div className="tree-shell">
              <div
                className="tree-columns"
                style={{ "--tree-cols": effectiveColumns } as CSSProperties}
              >
              {balancedColumns.map((column, columnIndex) => (
                <div key={`column-${columnIndex}`} className="tree-column">
                  {column.items.map(([type, items], groupIndex) => (
                    <div
                      key={`${type}-${columnIndex}`}
                      className={`tree-group ${
                        (columnIndex + groupIndex) % 2 === 0
                          ? "branch-left"
                          : "branch-right"
                      }`}
                    >
                      <div className="group-header">
                        <div className="group-dot" />
                        <span className="group-title">{type}</span>
                      </div>
                      <div className="tree-list">
                        {sortedByOrder(items).map((material) => (
                          <div
                            key={material.id}
                            className="tree-node"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "text/plain",
                                material.id
                              );
                              handleDragStart(material);
                            }}
                            onDragEnd={handleDragEnd}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              const sourceId =
                                event.dataTransfer.getData("text/plain");
                              handleDrop(sourceId, material.id, material.type);
                            }}
                          >
                            <MaterialCard
                              material={material}
                              onEdit={(item) => handleOpenModal(item)}
                              onDelete={handleDelete}
                              dragging={draggingId === material.id}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        <AddMaterialModal
          key={`${editingMaterial?.id ?? "new"}-${modalOpen ? "open" : "closed"}`}
          open={modalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={editingMaterial}
          typeOptions={typeOptions}
        />
      </div>
    </div>
  );
}
