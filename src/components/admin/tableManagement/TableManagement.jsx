// src/components/admin/tableManagement/TableManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  useGetRestaurantQuery,
  useCreateSectionsAndUnitsMutation,
  useToggleUnitActiveMutation,
  useDeleteSectionMutation,
  useDeleteUnitMutation,
  useUpdateSectionsMutation,
} from "@/redux/adminRedux/adminAPI";
import { Download, Loader2, Power, PowerOff, QrCode, Table2, BedDouble, Plus, Minus, Trash2, ArrowLeft, SquarePen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotification } from "@/components/admin/Bell/NotificationContext";

/* ───────────────────────────────────────────
   HELPERS
   ─────────────────────────────────────────── */

/** Trigger a file download from a URL */
const downloadQR = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // fallback: open in new tab
    window.open(url, "_blank");
  }
};

/** Extract sections + units from restaurant profile */
const extractSections = (restaurant) => {
  if (!restaurant) return [];
  const data = restaurant.restaurant || restaurant;
  return Array.isArray(data.sections) ? data.sections : [];
};

const extractRoomCategories = (sections = []) => {
  const categories = new Map();

  sections.forEach((section) => {
    (section?.units || []).forEach((unit) => {
      if (unit?.type !== "ROOM") return;
      const name = String(unit?.roomCategory?.name || "").trim();
      if (!name) return;

      const key = name.toLowerCase();
      const pricePerNight =
        Number(
          unit?.roomCategory?.priceConfig?.pricePerNight ??
          unit?.roomCategory?.pricePerNight ??
          0
        ) || 0;

      const existing = categories.get(key);
      if (!existing || (!existing.pricePerNight && pricePerNight > 0)) {
        categories.set(key, { name, pricePerNight });
      }
    });
  });

  return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const createCustomUnitDraft = () => ({
  name: "",
  categorySelection: "",
  categoryName: "",
  pricePerNight: "",
});

const buildRoomCategoryPayload = ({
  categorySelection = "",
  categoryName = "",
  pricePerNight = "",
  fallbackName = "",
}) => {
  const finalName = String(
    categorySelection && categorySelection !== "__new__"
      ? categorySelection
      : categoryName || fallbackName
  ).trim();

  if (!finalName) return null;

  return {
    name: finalName,
    pricingModel: "PER_NIGHT",
    priceConfig: {
      pricePerNight: Number(pricePerNight) || 0,
    },
  };
};

/* ───────────────────────────────────────────
   CATEGORY ICON
   ─────────────────────────────────────────── */

const typeIcon = (type) => {
  if (type === "TABLE") return <Table2 size={16} />;
  if (type === "ROOM") return <BedDouble size={16} />;
  return null;
};

/* ───────────────────────────────────────────
   ADD SECTION / UNITS FORM
   ─────────────────────────────────────────── */

function AddUnitsForm({ onSuccess, existingSectionNames, existingRoomCategories = [] }) {
  const [addUnits, { isLoading }] = useCreateSectionsAndUnitsMutation();
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  const [sectionName, setSectionName] = useState("");
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState("");

  const [type, setType] = useState("TABLE");
  const [customUnits, setCustomUnits] = useState([createCustomUnitDraft()]);
  const [formError, setFormError] = useState("");

  // Auto-select first existing section on load (if any)
  useEffect(() => {
    if (!sectionName && !isCreatingNewSection && Array.isArray(existingSectionNames) && existingSectionNames.length > 0) {
      setSectionName(existingSectionNames[0]);
    }
  }, [existingSectionNames, sectionName, isCreatingNewSection]);

  const reset = () => {
    setSectionName("");
    setIsCreatingNewSection(false);
    setNewSectionInput("");
    setType("TABLE");
    setCustomUnits([createCustomUnitDraft()]);
  };

  const handleAddCustomRow = () => {
    setCustomUnits((prev) => [...prev, createCustomUnitDraft()]);
  };

  const handleRemoveCustomRow = (idx) => {
    setCustomUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCustomChange = (idx, field, value) => {
    setCustomUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u))
    );
  };

  const handleCustomCategorySelect = (idx, value) => {
    setCustomUnits((prev) =>
      prev.map((unit, unitIdx) => {
        if (unitIdx !== idx) return unit;

        if (value === "__new__") {
          return {
            ...unit,
            categorySelection: "__new__",
            categoryName: "",
            pricePerNight: "",
          };
        }

        const selectedCategory = existingRoomCategories.find((category) => category.name === value);
        return {
          ...unit,
          categorySelection: value,
          categoryName: selectedCategory?.name || value,
          pricePerNight:
            selectedCategory?.pricePerNight != null
              ? String(selectedCategory.pricePerNight)
              : unit.pricePerNight,
        };
      })
    );
  };

  const handleSectionChange = (value) => {
    if (value === "__new__") {
      setIsCreatingNewSection(true);
      setSectionName("");
    } else {
      setIsCreatingNewSection(false);
      setSectionName(value);
      setNewSectionInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const finalSectionName = (isCreatingNewSection ? newSectionInput : sectionName).trim();
    if (!finalSectionName) {
      setFormError("Please select a section");
      return;
    }

    const validUnits = customUnits.filter((u) => u.name.trim());
    if (validUnits.length === 0) {
      setFormError("Please enter a name for each unit");
      return;
    }

    if (type === "ROOM") {
      const missingCategory = validUnits.some(
        (u) =>
          !buildRoomCategoryPayload({
            categorySelection: u.categorySelection,
            categoryName: u.categoryName,
            pricePerNight: u.pricePerNight,
          })
      );
      if (missingCategory) {
        setFormError("Please select or create a category for each room");
        return;
      }
    }

    // Client-side duplicate check
    const names = validUnits.map(u => u.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      setFormError("Unit name already exists, please use a different name");
      return;
    }

    const body = {
      sectionName: finalSectionName,
      type,
      units: validUnits.map((u) => ({
        name: u.name.trim(),
        ...(type === "ROOM"
          ? {
              roomCategory: {
                ...buildRoomCategoryPayload({
                  categorySelection: u.categorySelection,
                  categoryName: u.categoryName,
                  pricePerNight: u.pricePerNight,
                  fallbackName: u.name,
                }),
              },
            }
          : {}),
      })),
    };

    try {
      await addUnits(body).unwrap();
      onSuccess?.();
      reset();
    } catch (err) {
      const backendMsg = err?.data?.message || "";
      if (backendMsg.includes("Duplicate unit name")) {
        setFormError("Unit name already exists, please use a different name");
      } else {
        setFormError("Something went wrong, please try again");
      }
    }
  };

  /* ── STYLES ── */
  const inputBase =
    "w-full rounded-lg border border-[#ede8e3] bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-orange-950 dark:focus:border-orange-500";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400";
  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SECTION / CATEGORY - Themed dropdown using project Select component */}
      <div className="space-y-1.5">
        <label className={labelCls}>Section</label>

        <Select
          value={isCreatingNewSection ? "__new__" : sectionName}
          onValueChange={handleSectionChange}
        >
          <SelectTrigger className="w-full border-[#ede8e3] bg-white text-sm font-medium text-[#1c1917] focus:ring-orange-200 focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <SelectValue 
              placeholder={
                existingSectionNames?.length 
                  ? "Select existing section" 
                  : "No sections yet"
              } 
            />
          </SelectTrigger>
          <SelectContent className="border-[#ede8e3] bg-white dark:border-slate-700 dark:bg-slate-800">
            {(existingSectionNames || []).map((name) => (
              <SelectItem 
                key={name} 
                value={name}
                className="cursor-pointer focus:bg-[#f7f3ef] dark:focus:bg-slate-700"
              >
                {name}
              </SelectItem>
            ))}
            <SelectItem 
              value="__new__" 
              className="cursor-pointer text-orange-600 focus:bg-[#f7f3ef] dark:focus:bg-slate-700 dark:text-orange-400"
            >
              + Create New Section
            </SelectItem>
          </SelectContent>
        </Select>

        {isCreatingNewSection && (
          <input
            type="text"
            placeholder="Enter new section name"
            value={newSectionInput}
            onChange={(e) => setNewSectionInput(e.target.value)}
            className={inputBase}
            required
          />
        )}

        {/* Helpful hint */}
        {!isCreatingNewSection && sectionName && (
          <p className="text-[11px] text-[#78716c] dark:text-slate-400">
            Adding to existing section: <span className="font-semibold">{sectionName}</span>
          </p>
        )}
      </div>

      {/* TYPE */}
      <div className="space-y-1.5">
        <label className={labelCls}>Type</label>
        <div className="flex gap-2">
          {["TABLE", "ROOM"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`${btnBase} ${
                type === t
                  ? isDarkMode
                    ? "border border-orange-500/35 bg-orange-950/20 text-orange-400 font-extrabold shadow-sm"
                    : "border border-orange-200 bg-orange-50 text-orange-700 font-extrabold shadow-sm"
                  : "bg-white text-[#78716c] border border-[#ede8e3] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {t === "TABLE" ? <Table2 size={14} /> : <BedDouble size={14} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* UNITS (Custom Names) */}
      <div>
        <div className="space-y-3">
          <label className={labelCls}>Units</label>
          {customUnits.map((u, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder={type === "TABLE" ? "Table name" : "Room name / number (e.g. 101)"}
                  value={u.name}
                  onChange={(e) => handleCustomChange(idx, "name", e.target.value)}
                  className={inputBase}
                />
                {type === "ROOM" && (
                  <>
                    <Select
                      value={u.categorySelection || undefined}
                      onValueChange={(value) => handleCustomCategorySelect(idx, value)}
                    >
                      <SelectTrigger className="w-full border-[#ede8e3] bg-white text-sm font-medium text-[#1c1917] focus:ring-orange-200 focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        <SelectValue placeholder="Select existing category or create new" />
                      </SelectTrigger>
                      <SelectContent className="border-[#ede8e3] bg-white dark:border-slate-700 dark:bg-slate-800">
                        {existingRoomCategories.map((category) => (
                          <SelectItem
                            key={category.name}
                            value={category.name}
                            className="cursor-pointer focus:bg-[#f7f3ef] dark:focus:bg-slate-700"
                          >
                            {category.name}
                            {category.pricePerNight > 0 ? ` • ₹${category.pricePerNight}/night` : ""}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="__new__"
                          className="cursor-pointer text-orange-600 focus:bg-[#f7f3ef] dark:focus:bg-slate-700 dark:text-orange-400"
                        >
                          + Create New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {(!u.categorySelection || u.categorySelection === "__new__") && (
                      <input
                        type="text"
                        placeholder="Category name (e.g. Deluxe)"
                        value={u.categoryName}
                        onChange={(e) => handleCustomChange(idx, "categoryName", e.target.value)}
                        className={inputBase}
                      />
                    )}
                    <input
                      type="number"
                      placeholder="Price per night (₹)"
                      value={u.pricePerNight}
                      onChange={(e) => handleCustomChange(idx, "pricePerNight", e.target.value)}
                      className={inputBase}
                      min="0"
                      step="1"
                    />
                  </>
                )}
              </div>
              {customUnits.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomRow(idx)}
                  className="mt-1 rounded-lg p-2 text-[#a8a29e] hover:bg-red-50 hover:text-red-500 transition-colors dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCustomRow}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors dark:text-orange-400 dark:hover:text-orange-300"
          >
            <Plus size={14} /> Add another
          </button>
        </div>
      </div>

      {/* SUBMIT */}
      {formError && (
        <div style={{ color: "#dc2626", fontSize: 13, padding: "8px 0", textAlign: "center" }}>
          {formError}
        </div>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className={`${btnBase} w-full flex items-center justify-center gap-2 border border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] hover:border-orange-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400`}
      >
        {isLoading ? "Adding..." : `Add ${type === "TABLE" ? "Tables" : "Rooms"}`}
      </button>
    </form>
  );
}

/* ───────────────────────────────────────────
   UNIT CARD (single table/room)
   ─────────────────────────────────────────── */

function UnitCard({ unit, onDeleteUnit, onEditRoom }) {
  const [imgError, setImgError] = useState(false);
  const { notify } = useNotification();
  const [toggleUnitActive, { isLoading: isToggleLoading }] = useToggleUnitActiveMutation();

  const unitId = unit?._id || unit?.unitId;
  const isRoom = unit?.type === "ROOM";
  const isActive = unit?.isActive !== false;
  const canToggleRoom = isRoom && unit?.status === "AVAILABLE" && Boolean(unitId);

  const handleDownload = () => {
    const filename = `${unit.type}_${unit.name}_qr.png`;
    downloadQR(unit.qrCode?.url, filename);
  };

  const handleToggleRoomActive = async (e) => {
    e.stopPropagation();

    if (!canToggleRoom || isToggleLoading) return;

    const nextIsActive = !isActive;

    try {
      const response = await toggleUnitActive({
        unitId,
        isActive: nextIsActive,
      }).unwrap();

      notify(
        response?.message || `Room ${nextIsActive ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (err) {
      notify(
        err?.data?.message || `Failed to ${nextIsActive ? "activate" : "deactivate"} room`,
        "error"
      );
    }
  };

  const handleDeleteUnit = (e) => {
    e.stopPropagation();
    onDeleteUnit(unitId, unit.name, isRoom);
  };

  return (
    <div
      className={`relative rounded-xl border bg-white p-2 transition-all duration-150 hover:shadow-sm dark:bg-[#1e293b] ${
        isRoom && !isActive
          ? "border-[#d6cfc8] bg-[#faf7f4] opacity-80 dark:border-slate-600 dark:bg-slate-900/70"
          : "border-[#ede8e3] dark:border-slate-700"
      }`}
    >
      {/* TOP BADGES ROW */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        {isRoom ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
              isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-[#ede8e3] text-[#78716c] dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        ) : (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400">
            Table
          </span>
        )}

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
            unit.status === "AVAILABLE"
              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
              : unit.status === "OCCUPIED"
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300"
              : unit.status === "BILLED"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          }`}
        >
          {unit.status}
        </span>
      </div>

      {/* QR CODE */}
      <div className="flex justify-center mb-3 mt-1.5">
        {unit.qrCode?.url && !imgError ? (
          <img
            src={unit.qrCode.url}
            alt={`QR for ${unit.name}`}
            loading="lazy"
            className={`h-20 w-20 rounded-md border border-[#ede8e3] object-contain ${
              isRoom && !isActive ? "grayscale" : ""
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-[#ede8e3] bg-[#f7f3ef] dark:border-slate-600 dark:bg-slate-800/60">
            <QrCode size={30} className="text-[#a8a29e] dark:text-slate-500" />
          </div>
        )}
      </div>

      {/* NAME + TYPE */}
      <div className="text-center space-y-0.5">
        <p className="text-base font-bold text-[#1c1917] truncate dark:text-slate-100">{unit.name}</p>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
          {typeIcon(unit.type)}
          {unit.type}
          {unit.type === "ROOM" && (unit.roomCategory?.pricePerNight > 0 || unit.roomCategory?.priceConfig?.pricePerNight > 0) && (
            <> · ₹{unit.roomCategory?.priceConfig?.pricePerNight ?? unit.roomCategory?.pricePerNight}</>
          )}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex gap-1.5 w-full">
          {unit.qrCode?.url && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#ede8e3] bg-[#f7f3ef] px-2 py-1.5 text-[11px] font-extrabold text-[#1c1917] transition-colors hover:bg-[#ede8e3] dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap shadow-sm"
            >
              <Download size={13} /> QR
            </button>
          )}

          {isRoom && (
            <button
              type="button"
              onClick={handleToggleRoomActive}
              disabled={!canToggleRoom || isToggleLoading}
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-extrabold transition-all active:scale-[0.97] whitespace-nowrap shadow-sm ${
                canToggleRoom && !isToggleLoading
                  ? isActive
                    ? "border border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5]"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "cursor-not-allowed bg-[#ede8e3] text-[#a8a29e] dark:bg-slate-700 dark:text-slate-500"
              }`}
            >
              {isToggleLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                </>
              ) : isActive ? (
                <>
                  <PowerOff size={13} /> Inactive
                </>
              ) : (
                <>
                  <Power size={13} /> Active
                </>
              )}
            </button>
          )}

          {isRoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditRoom({
                  id: unitId,
                  name: unit.name,
                  categoryName: unit.roomCategory?.name || "",
                  pricePerNight: String(unit.roomCategory?.priceConfig?.pricePerNight ?? unit.roomCategory?.pricePerNight ?? "0"),
                });
              }}
              className="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-white p-1.5 text-orange-600 hover:bg-[#fff8f5] dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400 shadow-sm"
              title="Edit Room Category/Price"
            >
              <SquarePen size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteUnit}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 shadow-sm"
            title={`Delete ${isRoom ? "Room" : "Table"}`}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {isRoom && !canToggleRoom && (
          <p className="text-center text-[9px] font-bold text-[#a8a29e] dark:text-slate-500 leading-tight">
            Can toggle room only when Available
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   SECTION BLOCK
   ─────────────────────────────────────────── */

function SectionBlock({ section, onDeleteSection, onDeleteUnit, onEditSection, onEditRoom }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(section.name);

  useEffect(() => {
    setNewName(section.name);
  }, [section.name]);

  const tables = useMemo(
    () => (Array.isArray(section.units) ? section.units.filter((u) => u.type === "TABLE") : []),
    [section.units]
  );
  const rooms = useMemo(
    () => (Array.isArray(section.units) ? section.units.filter((u) => u.type === "ROOM") : []),
    [section.units]
  );

  const handleDeleteSection = (e) => {
    e.stopPropagation();
    onDeleteSection(section._id, section.name);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onEditSection(section._id, newName.trim());
    setIsEditingName(false);
  };

  if (tables.length === 0 && rooms.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#ede8e3] bg-white overflow-hidden dark:border-slate-700 dark:bg-[#1e293b]">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ede8e3] bg-[#faf9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-2 flex-1">
          {isEditingName ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-[#ede8e3] bg-white px-2 py-1 text-xs font-bold text-[#1c1917] outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
                autoFocus
              />
              <button
                type="submit"
                className="rounded-md bg-orange-500 text-white px-2.5 py-1 text-xs font-extrabold hover:bg-orange-600 transition-colors shadow-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setIsEditingName(false); setNewName(section.name); }}
                className="rounded-md border border-[#ede8e3] bg-white px-2 py-1 text-xs font-semibold text-[#78716c] hover:bg-[#f7f3ef] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1c1917] dark:text-slate-100">{section.name}</h3>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="rounded-md p-1.5 text-[#a8a29e] hover:bg-[#ede8e3]/45 hover:text-orange-500 transition-colors dark:text-slate-400"
                title="Rename Section"
              >
                <SquarePen size={15} />
              </button>
              <span className="rounded-full bg-[#ede8e3] px-2.5 py-0.5 text-xs font-semibold text-[#78716c] dark:bg-slate-700 dark:text-slate-300">
                {section.units?.length || 0} total
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleDeleteSection}
          className="rounded-lg p-2 text-[#a8a29e] hover:bg-red-50 hover:text-red-500 transition-colors dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400"
          title="Delete Section"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* BODY */}
      <div className="space-y-4 p-4">
        {tables.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <Table2 size={16} /> Tables ({tables.length})
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
              {tables.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} onDeleteUnit={onDeleteUnit} onEditRoom={onEditRoom} />
              ))}
            </div>
          </div>
        )}

        {rooms.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <BedDouble size={16} /> Rooms ({rooms.length})
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
              {rooms.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} onDeleteUnit={onDeleteUnit} onEditRoom={onEditRoom} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────── */

export default function TableManagement() {
  const navigate = useNavigate();
  const {
    data: restaurantData,
    isLoading,
    error,
  } = useGetRestaurantQuery();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'section' | 'unit', id: string, name: string, isRoom?: boolean }
  const [editRoomTarget, setEditRoomTarget] = useState(null); // { id, name, categoryName, pricePerNight }
  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteSectionMutation();
  const [deleteUnit, { isLoading: isDeletingUnit }] = useDeleteUnitMutation();
  const [updateSectionsApi, { isLoading: isUpdatingSections }] = useUpdateSectionsMutation();
  const { notify } = useNotification();

  const handleSaveSectionRename = async (sectionId, newName) => {
    try {
      await updateSectionsApi({
        sectionUpdates: [{ sectionId, name: newName }],
      }).unwrap();
      notify("Section renamed successfully", "success");
    } catch (err) {
      notify(err?.data?.message || "Failed to rename section", "error");
    }
  };

  const handleSaveRoomEdit = async (unitId, categoryName, pricePerNight) => {
    try {
      await updateSectionsApi({
        roomUpdates: [
          {
            unitId,
            roomCategory: {
              name: categoryName,
              pricingModel: "PER_NIGHT",
              priceConfig: {
                pricePerNight: Number(pricePerNight) || 0,
              },
            },
          },
        ],
      }).unwrap();
      notify("Room details updated successfully", "success");
      setEditRoomTarget(null);
    } catch (err) {
      notify(err?.data?.message || "Failed to update room details", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "section") {
        const res = await deleteSection(deleteTarget.id).unwrap();
        notify(res?.message || "Section deleted successfully", "success");
      } else {
        const res = await deleteUnit(deleteTarget.id).unwrap();
        notify(res?.message || `${deleteTarget.isRoom ? "Room" : "Table"} deleted successfully`, "success");
      }
      setDeleteTarget(null);
    } catch (err) {
      notify(err?.data?.message || `Failed to delete ${deleteTarget.type}`, "error");
    }
  };

  const sections = useMemo(() => extractSections(restaurantData), [restaurantData]);
  const existingSectionNames = useMemo(
    () => sections.map((s) => s.name),
    [sections]
  );
  const existingRoomCategories = useMemo(
    () => extractRoomCategories(sections),
    [sections]
  );

  const handleSuccess = () => setShowForm(false);
  const isDarkMode = typeof document !== "undefined" && (document.documentElement.classList.contains("admin-dark") || document.documentElement.classList.contains("dark"));

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/profile")}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-[#fff8f5] px-3.5 py-2 text-sm font-extrabold text-orange-700 shadow-sm transition-all hover:bg-[#ffedd5] active:scale-[0.97] dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold text-[#1c1917] dark:text-slate-100">Table & Room Management</h1>
            <p className="mt-0.5 text-xs text-[#78716c] dark:text-slate-400">
              Manage sections, tables, rooms and download QR codes
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1917] dark:text-slate-100">Table & Room Management</h1>
            <p className="mt-0.5 text-sm text-[#78716c] dark:text-slate-400">
              Manage sections, tables, rooms and download QR codes
            </p>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] ${
              showForm
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400"
            }`}
          >
            {showForm ? <Minus size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Section"}
          </button>
        </div>
        <div className="sm:hidden flex justify-end">
          <button
            onClick={() => setShowForm((p) => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] ${
              showForm
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400"
            }`}
          >
            {showForm ? <Minus size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Section"}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* ADD FORM (collapsible - 1 column) */}
        {showForm && (
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl border border-[#ede8e3] bg-white p-5 dark:border-slate-700 dark:bg-[#1e293b] shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-[#1c1917] dark:text-slate-100">Add New Section / Units</h2>
              <AddUnitsForm
                onSuccess={handleSuccess}
                existingSectionNames={existingSectionNames}
                existingRoomCategories={existingRoomCategories}
              />
            </div>
          </div>
        )}

        {/* SECTIONS LIST (2 columns if form open, else full 3 columns) */}
        <div className={`space-y-4 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* LOADING */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ede8e3] border-t-orange-500 dark:border-slate-600" />
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              Failed to load sections. Please try again.
            </div>
          )}

          {/* EMPTY */}
          {!isLoading && !error && sections.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#ede8e3] bg-white py-20 text-center dark:border-slate-700 dark:bg-[#1e293b]">
              <Table2 size={40} className="text-[#a8a29e] dark:text-slate-500" />
              <p className="text-sm font-semibold text-[#78716c] dark:text-slate-400">
                No sections or units configured yet
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-[#fff8f5] text-orange-700 hover:bg-[#ffedd5] dark:border-orange-500/35 dark:bg-orange-950/20 dark:text-orange-400"
              >
                <Plus size={14} /> Add Your First Section
              </button>
            </div>
          )}

          {/* SECTIONS LIST */}
          {!isLoading && !error && sections.length > 0 && (
            <div className="space-y-4">
              {sections.map((section) => (
                <SectionBlock
                  key={section._id || section.name}
                  section={section}
                  onDeleteSection={(id, name) => setDeleteTarget({ type: "section", id, name })}
                  onDeleteUnit={(id, name, isRoom) => setDeleteTarget({ type: "unit", id, name, isRoom })}
                  onEditSection={handleSaveSectionRename}
                  onEditRoom={setEditRoomTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL CARD */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[#ede8e3] bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#1e293b] animate-in scale-in duration-150">
            <h3 className="text-base font-bold text-[#1c1917] dark:text-slate-100">
              Delete {deleteTarget.type === "section" ? "Section" : deleteTarget.isRoom ? "Room" : "Table"}
            </h3>
            <p className="mt-2 text-sm text-[#78716c] dark:text-slate-400">
              {deleteTarget.type === "section"
                ? `Are you sure you want to delete the section "${deleteTarget.name}" and all its units? This action cannot be undone.`
                : `Are you sure you want to delete the ${deleteTarget.isRoom ? "room" : "table"} "${deleteTarget.name}"? This action cannot be undone.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingSection || isDeletingUnit}
                className="rounded-lg border border-[#ede8e3] bg-white px-4 py-2 text-sm font-semibold text-[#78716c] hover:bg-[#f7f3ef] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingSection || isDeletingUnit}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {(isDeletingSection || isDeletingUnit) && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT ROOM DETAILS MODAL CARD */}
      {editRoomTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[#ede8e3] bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#1e293b] animate-in scale-in duration-150">
            <h3 className="text-base font-bold text-[#1c1917] dark:text-slate-100">
              Edit Room: {editRoomTarget.name}
            </h3>
            <p className="mt-1 text-xs text-[#78716c] dark:text-slate-400">
              Update category name and price per night config for this room.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const categoryName = formData.get("categoryName").toString().trim();
                const pricePerNight = formData.get("pricePerNight").toString().trim();
                if (!categoryName) return;
                await handleSaveRoomEdit(editRoomTarget.id, categoryName, pricePerNight);
              }}
              className="mt-4 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
                  Category Name
                </label>
                <input
                  type="text"
                  name="categoryName"
                  defaultValue={editRoomTarget.categoryName}
                  required
                  className="w-full rounded-lg border border-[#ede8e3] bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-orange-950 dark:focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
                  Price per night (₹)
                </label>
                <input
                  type="number"
                  name="pricePerNight"
                  defaultValue={editRoomTarget.pricePerNight}
                  min="0"
                  step="1"
                  required
                  className="w-full rounded-lg border border-[#ede8e3] bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-orange-950 dark:focus:border-orange-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditRoomTarget(null)}
                  disabled={isUpdatingSections}
                  className="rounded-lg border border-[#ede8e3] bg-white px-4 py-2 text-sm font-semibold text-[#78716c] hover:bg-[#f7f3ef] transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSections}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingSections && <Loader2 size={14} className="animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
