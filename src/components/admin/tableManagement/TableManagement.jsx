// src/components/admin/tableManagement/TableManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetRestaurantProfileQuery,
  useAddUnitsMutation,
} from "@/redux/adminRedux/adminAPI";
import { Download, QrCode, Table2, BedDouble, Plus, Minus, Trash2, ArrowLeft } from "lucide-react";
import { ADMIN_COLORS } from "@/redux/adminRedux/adminSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

/* ───────────────────────────────────────────
   CATEGORY ICON
   ─────────────────────────────────────────── */

const typeIcon = (type) => {
  if (type === "TABLE") return <Table2 size={14} />;
  if (type === "ROOM") return <BedDouble size={14} />;
  return null;
};

/* ───────────────────────────────────────────
   ADD SECTION / UNITS FORM
   ─────────────────────────────────────────── */

function AddUnitsForm({ onSuccess, existingSectionNames }) {
  const [addUnits, { isLoading }] = useAddUnitsMutation();

  const [sectionName, setSectionName] = useState("");
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState("");

  const [type, setType] = useState("TABLE");
  const [mode, setMode] = useState("count"); // "count" | "custom"
  const [count, setCount] = useState("");
  const [customUnits, setCustomUnits] = useState([{ name: "", pricePerNight: "" }]);
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
    setMode("count");
    setCount("");
    setCustomUnits([{ name: "", pricePerNight: "" }]);
  };

  const handleAddCustomRow = () => {
    setCustomUnits((prev) => [...prev, { name: "", pricePerNight: "" }]);
  };

  const handleRemoveCustomRow = (idx) => {
    setCustomUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCustomChange = (idx, field, value) => {
    setCustomUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u))
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

    const body = {
      sectionName: finalSectionName,
      type,
    };

    if (mode === "count") {
      const num = Number(count);
      if (!num || num < 1) {
        setFormError(num < 1 && count !== "" ? "Number of tables cannot be less than 1" : "Please enter how many tables you want to add");
        return;
      }
      body.count = num;
    } else {
      const validUnits = customUnits.filter((u) => u.name.trim());
      if (validUnits.length === 0) {
        setFormError("Please enter a name for each unit");
        return;
      }
      // Client-side duplicate check
      const names = validUnits.map(u => u.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        setFormError("Unit name already exists, please use a different name");
        return;
      }
      body.units = validUnits.map((u) => ({
        name: u.name.trim(),
        ...(type === "ROOM"
          ? {
              roomCategory: {
                name: u.name.trim(),
                pricingModel: "PER_NIGHT",
                priceConfig: {
                  pricePerNight: Number(u.pricePerNight) || 0,
                },
              },
            }
          : {}),
      }));
    }

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
    "w-full rounded-lg border border-[#ede8e3] bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-orange-500/20";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400";
  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SECTION / CATEGORY - Themed dropdown using project Select component */}
      <div className="space-y-1.5">
        <label className={labelCls}>Section / Category</label>

        <Select
          value={isCreatingNewSection ? "__new__" : sectionName}
          onValueChange={handleSectionChange}
        >
          <SelectTrigger className="w-full border-[#ede8e3] bg-white text-sm font-medium text-[#1c1917] focus:ring-orange-500/30 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-[#78716c] border border-[#ede8e3] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {t === "TABLE" ? <Table2 size={14} /> : <BedDouble size={14} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div className="space-y-1.5">
        <label className={labelCls}>Add Method</label>
        <div className="flex gap-2">
          {[
            { value: "count", label: "Bulk Count" },
            { value: "custom", label: "Custom Names" },
          ].map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`${btnBase} ${
                mode === m.value
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-[#78716c] border border-[#ede8e3] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* BULK COUNT */}
      {mode === "count" && (
        <div className="space-y-1.5">
          <label className={labelCls}>Count</label>
           <input
             type="number"
             value={count}
             onChange={(e) => {
               const val = e.target.value;
               if (val === "" || /^\d+$/.test(val)) {
                 setCount(val);
               }
             }}
             onWheel={(e) => e.currentTarget.blur()}
             className={inputBase}
             placeholder="e.g. 10"
           />
          <p className="text-[11px] text-[#a8a29e] dark:text-slate-500">
            {type === "TABLE"
              ? `Tables will be named T1, T2, ...`
              : `Rooms will be named 101, 102, ...`}
          </p>
        </div>
      )}

      {/* CUSTOM UNITS */}
      {mode === "custom" && (
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
                  <input
                    type="number"
                    placeholder="Price per night (₹)"
                    value={u.pricePerNight}
                    onChange={(e) => handleCustomChange(idx, "pricePerNight", e.target.value)}
                    className={inputBase}
                    min="0"
                    step="1"
                  />
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
      )}

      {/* SUBMIT */}
      {formError && (
        <div style={{ color: "#dc2626", fontSize: 13, padding: "8px 0", textAlign: "center" }}>
          {formError}
        </div>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className={`${btnBase} bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? "Adding..." : `Add ${type === "TABLE" ? "Tables" : "Rooms"}`}
      </button>
    </form>
  );
}

/* ───────────────────────────────────────────
   UNIT CARD (single table/room)
   ─────────────────────────────────────────── */

function UnitCard({ unit }) {
  const [imgError, setImgError] = useState(false);

  const handleDownload = () => {
    const filename = `${unit.type}_${unit.name}_qr.png`;
    downloadQR(unit.qrCode?.url, filename);
  };

  return (
    <div className="group relative rounded-lg border border-[#ede8e3] bg-white p-3 transition-all duration-150 hover:shadow-md dark:border-slate-700 dark:bg-[#1e293b]">
      {/* STATUS BADGE */}
      <span
        className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          unit.status === "AVAILABLE"
            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
            : unit.status === "OCCUPIED"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300"
            : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        }`}
      >
        {unit.status}
      </span>

      {/* QR CODE */}
      <div className="flex justify-center mb-2">
        {unit.qrCode?.url && !imgError ? (
          <img
            src={unit.qrCode.url}
            alt={`QR for ${unit.name}`}
            className="h-20 w-20 rounded-md border border-[#ede8e3] object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-[#ede8e3] bg-[#f7f3ef] dark:border-slate-600 dark:bg-slate-800/60">
            <QrCode size={28} className="text-[#a8a29e] dark:text-slate-500" />
          </div>
        )}
      </div>

      {/* NAME + TYPE */}
      <div className="text-center">
        <p className="text-sm font-bold text-[#1c1917] truncate dark:text-slate-100">{unit.name}</p>
        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
          {typeIcon(unit.type)}
          {unit.type}
          {unit.type === "ROOM" && unit.roomCategory?.priceConfig?.pricePerNight > 0 && (
            <> · ₹{unit.roomCategory.priceConfig.pricePerNight}</>
          )}
        </p>
      </div>

      {/* DOWNLOAD BUTTON (on hover) */}
      {unit.qrCode?.url && (
        <button
          onClick={handleDownload}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#1c1917] shadow-sm dark:bg-slate-800 dark:text-slate-100">
            <Download size={14} /> Download QR
          </span>
        </button>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
   SECTION BLOCK
   ─────────────────────────────────────────── */

function SectionBlock({ section }) {
  const tables = useMemo(
    () => (Array.isArray(section.units) ? section.units.filter((u) => u.type === "TABLE") : []),
    [section.units]
  );
  const rooms = useMemo(
    () => (Array.isArray(section.units) ? section.units.filter((u) => u.type === "ROOM") : []),
    [section.units]
  );

  if (tables.length === 0 && rooms.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#ede8e3] bg-white overflow-hidden dark:border-slate-700 dark:bg-[#1e293b]">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ede8e3] bg-[#faf9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1c1917] dark:text-slate-100">{section.name}</h3>
          <span className="rounded-full bg-[#ede8e3] px-2 py-0.5 text-[10px] font-semibold text-[#78716c] dark:bg-slate-700 dark:text-slate-300">
            {section.units?.length || 0} total
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="space-y-4 p-4">
        {tables.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <Table2 size={14} /> Tables ({tables.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} />
              ))}
            </div>
          </div>
        )}

        {rooms.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <BedDouble size={14} /> Rooms ({rooms.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {rooms.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} />
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

export default function TableManagement({ isDarkMode = false }) {
  const navigate = useNavigate();
  const {
    data: restaurantData,
    isLoading,
    error,
  } = useGetRestaurantProfileQuery();

  const [showForm, setShowForm] = useState(false);

  const sections = useMemo(() => extractSections(restaurantData), [restaurantData]);
  const existingSectionNames = useMemo(
    () => sections.map((s) => s.name),
    [sections]
  );

  const handleSuccess = () => setShowForm(false);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/profile")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="sm:hidden">
            <h1 className="text-base font-bold text-[#1c1917] dark:text-slate-100">Table & Room Management</h1>
            <p className="mt-0.5 text-xs text-[#78716c] dark:text-slate-400">
              Manage sections, tables, rooms and download QR codes
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1c1917] dark:text-slate-100">Table & Room Management</h1>
            <p className="mt-0.5 text-sm text-[#78716c] dark:text-slate-400">
              Manage sections, tables, rooms and download QR codes
            </p>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600"
          >
            {showForm ? <Minus size={14} /> : <Plus size={14} />}
            {showForm ? "Close" : "Add Section"}
          </button>
        </div>
        <div className="sm:hidden flex justify-end">
          <button
            onClick={() => setShowForm((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600"
          >
            {showForm ? <Minus size={14} /> : <Plus size={14} />}
            {showForm ? "Close" : "Add Section"}
          </button>
        </div>
      </div>

      {/* ADD FORM (collapsible) */}
      {showForm && (
        <div className="rounded-xl border border-[#ede8e3] bg-white p-5 max-w-md mx-auto dark:border-slate-700 dark:bg-[#1e293b]">
          <h2 className="mb-4 text-sm font-bold text-[#1c1917] dark:text-slate-100">Add New Section / Units</h2>
          <AddUnitsForm
            onSuccess={handleSuccess}
            existingSectionNames={existingSectionNames}
          />
        </div>
      )}

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
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600"
            >
              <Plus size={14} /> Add Your First Section
            </button>
        </div>
      )}

      {/* SECTIONS LIST */}
      {!isLoading && !error && sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section) => (
            <SectionBlock key={section._id || section.name} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}