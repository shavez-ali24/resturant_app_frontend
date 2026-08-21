// src/components/admin/tableManagement/TableManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
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
import { Download, Loader2, Eye, EyeOff, QrCode, Table2, BedDouble, Plus, Minus, Trash, ArrowLeft, SquarePen } from "lucide-react";
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
const downloadQR = async (url, filename, unitType, unitName, categoryName, sectionName) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const hasCategoryOrSection =
      (unitType === "ROOM" && categoryName) ||
      (unitType === "TABLE" && sectionName);

    if (hasCategoryOrSection) {
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = blobUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      URL.revokeObjectURL(blobUrl);

      const canvas = document.createElement("canvas");
      const qrSize = img.width || 1000;
      const labelHeight = (img.height || 1120) - qrSize;
      
      canvas.width = qrSize;
      canvas.height = qrSize + labelHeight;
      const ctx = canvas.getContext("2d");

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw white rect to cover old label
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, qrSize, qrSize, labelHeight);

      // Draw separator line
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, qrSize);
      ctx.lineTo(qrSize, qrSize);
      ctx.stroke();

      // Draw new text label
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 72px Arial";
      
      let label = unitName;
      if (unitType === "ROOM") {
        const cat = categoryName ? categoryName.trim().toUpperCase() : "";
        label = cat ? `${cat} ROOM - ${unitName}` : `ROOM - ${unitName}`;
      } else if (unitType === "TABLE") {
        const sec = sectionName ? sectionName.trim().toUpperCase() : "";
        label = sec ? `${sec} TABLE - ${unitName}` : `TABLE - ${unitName}`;
      }
      ctx.fillText(label, qrSize / 2, qrSize + labelHeight / 2);

      const finalBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const finalUrl = URL.createObjectURL(finalBlob);
      
      const link = document.createElement("a");
      link.href = finalUrl;
      link.download = filename || "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(finalUrl);
    } else {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.error("Canvas QR download failed:", err);
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

function AddUnitsForm({ onSuccess, existingSectionNames, existingRoomCategories = [], isDarkMode }) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const [addUnits, { isLoading }] = useCreateSectionsAndUnitsMutation();

  const [sectionName, setSectionName] = useState("");
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState("");

  const newSectionInputRef = React.useRef(null);

  useEffect(() => {
    if (isCreatingNewSection) {
      const timer = setTimeout(() => {
        newSectionInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isCreatingNewSection]);

  const [shouldFocusLastUnit, setShouldFocusLastUnit] = useState(false);
  const [focusCategoryNameIdx, setFocusCategoryNameIdx] = useState(null);

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
    setShouldFocusLastUnit(true);
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
          setFocusCategoryNameIdx(idx);
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
      onSuccess?.(body);
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
    "w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-[#78716c] dark:text-slate-400";
  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150";

  const handleInputFocus = (e) => {
    e.currentTarget.style.borderColor = colors.primary;
    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
  };
  const handleInputBlur = (e) => {
    e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
    e.currentTarget.style.boxShadow = "none";
  };

  const inputStyle = {
    borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SECTION / CATEGORY - Themed dropdown using project Select component */}
      <div className="space-y-1.5">
        <label className={labelCls}>Section</label>

        <Select
          value={isCreatingNewSection ? "__new__" : sectionName}
          onValueChange={handleSectionChange}
        >
          <SelectTrigger 
            className="w-full bg-white text-sm font-medium text-[#1c1917] dark:bg-slate-800 dark:text-slate-100"
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
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
              className="cursor-pointer font-bold focus:bg-[#f7f3ef] dark:focus:bg-slate-700"
              style={{ color: colors.primary }}
            >
              + Create New Section
            </SelectItem>
          </SelectContent>
        </Select>

        {isCreatingNewSection && (
          <input
            ref={newSectionInputRef}
            type="text"
            placeholder="Enter new section name"
            value={newSectionInput}
            onChange={(e) => setNewSectionInput(e.target.value)}
            className={inputBase}
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
                  ? "shadow-sm border font-extrabold"
                  : "bg-white text-[#78716c] border border-[#ede8e3] hover:bg-[#f7f3ef] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
              style={type === t ? {
                borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                color: isDarkMode ? colors.primary : colors.primaryText,
              } : {}}
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
                  ref={el => {
                    if (el && idx === customUnits.length - 1 && shouldFocusLastUnit) {
                      el.focus();
                      setShouldFocusLastUnit(false);
                    }
                  }}
                  type="text"
                  placeholder={type === "TABLE" ? "Table name" : "Room name / number (e.g. 101)"}
                  value={u.name}
                  onChange={(e) => handleCustomChange(idx, "name", e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                {type === "ROOM" && (
                  <>
                    <Select
                      value={u.categorySelection || undefined}
                      onValueChange={(value) => handleCustomCategorySelect(idx, value)}
                    >
                      <SelectTrigger 
                        className="w-full bg-white text-sm font-medium text-[#1c1917] dark:bg-slate-800 dark:text-slate-100"
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      >
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
                          className="cursor-pointer font-bold focus:bg-[#f7f3ef] dark:focus:bg-slate-700"
                          style={{ color: colors.primary }}
                        >
                          + Create New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {(!u.categorySelection || u.categorySelection === "__new__") && (
                      <input
                        ref={el => {
                          if (el && idx === focusCategoryNameIdx) {
                            const timer = setTimeout(() => {
                              el.focus();
                            }, 60);
                            setFocusCategoryNameIdx(null);
                          }
                        }}
                        type="text"
                        placeholder="Category name (e.g. Deluxe)"
                        value={u.categoryName}
                        onChange={(e) => handleCustomChange(idx, "categoryName", e.target.value)}
                        className={inputBase}
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    )}
                    <input
                      type="number"
                      placeholder="Price per night (₹)"
                      value={u.pricePerNight}
                      onChange={(e) => handleCustomChange(idx, "pricePerNight", e.target.value)}
                      className={inputBase}
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
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
                  className="mt-1 rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCustomRow}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-85 transition-colors"
            style={{ color: colors.primary }}
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
        className={`${btnBase} w-full flex items-center justify-center gap-2 border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
          backgroundColor: colors.primary,
          color: "#ffffff",
          borderColor: "transparent",
        }}
      >
        {isLoading 
          ? "Adding..." 
          : `Add ${type === "TABLE" 
              ? (customUnits.length > 1 ? "Tables" : "Table") 
              : (customUnits.length > 1 ? "Rooms" : "Room")
            }`
        }
      </button>
    </form>
  );
}

/* ───────────────────────────────────────────
   UNIT CARD (single table/room)
   ─────────────────────────────────────────── */

function UnitCard({ unit, onDeleteUnit, onEditRoom, isDarkMode, sectionName }) {
  const colors = useSelector((state) => state.admin.theme.colors);
  const [imgError, setImgError] = useState(false);
  const { notify } = useNotification();
  const [toggleUnitActive, { isLoading: isToggleLoading }] = useToggleUnitActiveMutation();

  const unitId = unit?._id || unit?.unitId;
  const isRoom = unit?.type === "ROOM";
  const isActive = unit?.isActive !== false;
  const canToggleUnit = unit?.status === "AVAILABLE" && Boolean(unitId);

  const handleDownload = () => {
    const filename = `${unit.type}_${unit.name}_qr.png`;
    downloadQR(
      unit.qrCode?.url,
      filename,
      unit.type,
      unit.name,
      unit.roomCategory?.name,
      sectionName
    );
  };

  const handleToggleUnitActive = async (e) => {
    e.stopPropagation();

    if (!canToggleUnit || isToggleLoading) return;

    const nextIsActive = !isActive;
    const unitLabel = isRoom ? "Room" : "Table";

    try {
      const response = await toggleUnitActive({
        unitId,
        isActive: nextIsActive,
      }).unwrap();

      notify(
        response?.message || `${unitLabel} ${nextIsActive ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (err) {
      notify(
        err?.data?.message || `Failed to ${nextIsActive ? "activate" : "deactivate"} ${unitLabel.toLowerCase()}`,
        "error"
      );
    }
  };

  const handleDeleteUnit = (e) => {
    e.stopPropagation();
    onDeleteUnit(unitId, unit.name, isRoom);
  };

  const getStatusStyles = (status, isDarkMode, colors) => {
    const primaryColor = colors?.primary || "#EF9F27";
    const primaryText = colors?.primaryText || "#7c2d12";
    const primaryLight = colors?.primaryLight || "#fff8f5";

    if (status === "OCCUPIED") {
      return {
        bg: isDarkMode ? `${primaryColor}1a` : primaryLight,
        border: isDarkMode ? `1.5px solid ${primaryColor}60` : `1.5px solid ${primaryColor}40`,
        statusText: isDarkMode ? primaryColor : primaryText,
        subText: isDarkMode ? primaryColor : primaryText,
        numColor: isDarkMode ? "#ffffff" : "#1c1917",
        qrColor: isDarkMode ? primaryColor : primaryText,
        btnBorder: isDarkMode ? `${primaryColor}50` : `${primaryColor}33`,
        btnBg: isDarkMode ? `${primaryColor}20` : primaryLight,
        btnColor: isDarkMode ? primaryColor : primaryText,
      };
    }
    if (status === "BILLED") {
      return {
        bg: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4",
        border: isDarkMode ? "1.5px solid rgba(16, 185, 129, 0.4)" : "1.5px solid rgba(16, 185, 129, 0.3)",
        statusText: isDarkMode ? "#34d399" : "#15803d",
        subText: isDarkMode ? "#34d399" : "#15803d",
        numColor: isDarkMode ? "#ffffff" : "#1c1917",
        qrColor: isDarkMode ? "#34d399" : "#15803d",
        btnBorder: isDarkMode ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)",
        btnBg: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
        btnColor: isDarkMode ? "#34d399" : "#15803d",
      };
    }
    // AVAILABLE / OTHER
    return {
      bg: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
      border: isDarkMode ? "1.5px solid rgb(51, 65, 85)" : "1.5px solid #e5e5e5",
      statusText: isDarkMode ? "#10b981" : "#15803d", // Green AVAILABLE text
      subText: isDarkMode ? "#94a3b8" : "#a8a29e", // Gray 'Table' / 'Room' label
      numColor: isDarkMode ? "#ffffff" : "#1c1917",
      qrColor: isDarkMode ? "#64748b" : "#a8a29e",
      btnBorder: isDarkMode ? "rgb(71, 85, 105)" : "#e5e5e5",
      btnBg: isDarkMode ? "rgb(30, 41, 59)" : "#ffffff",
      btnColor: isDarkMode ? "#94a3b8" : "#78716c",
    };
  };

  const statusStyle = getStatusStyles(unit.status, isDarkMode, colors);

  return (
    <div
      id={`tm-unit-${unit.name.replace(/\s+/g, '-').toLowerCase()}`}
      className={`relative rounded-xl p-3 transition-all duration-150 hover:shadow-md flex flex-col justify-between`}
      style={{
        background: statusStyle.bg,
        border: statusStyle.border,
        opacity: !isActive ? 0.75 : 1,
        minHeight: "140px",
      }}
    >
      {/* Top Row: status on left, small QR icon on right */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1">
          <span
            className="text-[9px] font-extrabold tracking-wider"
            style={{ color: isActive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)" }}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
          <span className="text-[#ede8e3] dark:text-slate-600">|</span>
          <span
            className="text-[9.5px] font-extrabold uppercase tracking-wider"
            style={{ color: statusStyle.statusText }}
          >
            {unit.status}
          </span>
        </div>
        
        <QrCode size={14} style={{ color: statusStyle.qrColor }} />
      </div>

      {/* Center: Large Name/Number & label */}
      <div className="text-center my-2 space-y-0.5">
        <p className="text-2xl font-extrabold" style={{ color: statusStyle.numColor }}>
          {unit.name}
        </p>
        <p
          className="text-[9.5px] font-bold uppercase tracking-widest"
          style={{ color: statusStyle.subText }}
        >
          {unit.type}
          {unit.type === "ROOM" && unit.roomCategory?.name && (
            <> • {unit.roomCategory.name}</>
          )}
          {unit.type === "ROOM" && (unit.roomCategory?.pricePerNight > 0 || unit.roomCategory?.priceConfig?.pricePerNight > 0) && (
            <> • ₹{unit.roomCategory?.priceConfig?.pricePerNight ?? unit.roomCategory?.pricePerNight}</>
          )}
        </p>
      </div>

      {/* Bottom Actions Row */}
      <div className="mt-1 space-y-1">
        <div className="flex gap-1.5 w-full">
          {unit.qrCode?.url && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center rounded-lg border py-1 text-[10px] font-bold transition-all active:scale-[0.97] shadow-sm hover:opacity-90"
              style={{
                borderColor: statusStyle.btnBorder,
                backgroundColor: statusStyle.btnBg,
                color: statusStyle.btnColor,
              }}
              title="Download QR Code"
            >
              <Download size={12} className="mr-0.5" /> QR
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleUnitActive}
            disabled={!canToggleUnit || isToggleLoading}
            className="inline-flex items-center justify-center rounded-lg p-1.5 border transition-all active:scale-[0.97] shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={canToggleUnit && !isToggleLoading ? {
              borderColor: isActive ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
              backgroundColor: isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: isActive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
            } : {
              borderColor: isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              backgroundColor: isActive ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
              color: isActive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
            }}
            title={isActive ? `Deactivate ${isRoom ? "Room" : "Table"}` : `Activate ${isRoom ? "Room" : "Table"}`}
          >
            {isToggleLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isActive ? (
              <Eye size={14} />
            ) : (
              <EyeOff size={14} />
            )}
          </button>

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
              className="inline-flex items-center justify-center rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors active:scale-[0.97]"
              title="Edit Room Category/Price"
            >
              <SquarePen size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteUnit}
            className="inline-flex items-center justify-center rounded-lg p-1 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors active:scale-[0.97]"
            title={`Delete ${isRoom ? "Room" : "Table"}`}
          >
            <Trash size={12} />
          </button>
        </div>

        {!canToggleUnit && (
          <p className="text-center text-[8px] font-bold text-[#a8a29e] dark:text-slate-500 leading-tight">
            Can toggle {isRoom ? "room" : "table"} only when Available
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   SECTION BLOCK
   ─────────────────────────────────────────── */

function SectionBlock({ section, onDeleteSection, onDeleteUnit, onEditSection, onEditRoom, isDarkMode }) {
  const colors = useSelector((state) => state.admin.theme.colors);
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

  const roomGroups = useMemo(() => {
    const groups = new Map();
    rooms.forEach((unit) => {
      const categoryName = String(unit?.roomCategory?.name || "Uncategorized").trim() || "Uncategorized";
      if (!groups.has(categoryName)) groups.set(categoryName, []);
      groups.get(categoryName).push(unit);
    });
    return Array.from(groups.entries())
      .map(([categoryName, groupUnits]) => ({ categoryName, units: groupUnits }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [rooms]);

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
    <div
      id={`tm-section-${section.name.replace(/\s+/g, '-').toLowerCase()}`}
      className="rounded-xl border border-[#ede8e3] bg-white overflow-hidden dark:border-slate-700 dark:bg-[#1e293b]"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ede8e3] bg-[#faf9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-2 flex-1">
          {isEditingName ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border bg-white px-2 py-1 text-xs font-bold text-[#1c1917] outline-none dark:bg-slate-800 dark:text-slate-100"
                style={{
                  borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
                  e.currentTarget.style.boxShadow = "none";
                }}
                required
                autoFocus
              />
              <button
                type="submit"
                className="rounded-md text-white px-2.5 py-1 text-xs font-extrabold transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
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
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
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
          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
          title="Delete Section"
        >
          <Trash size={18} />
        </button>
      </div>

      {/* BODY */}
      <div className="space-y-4 p-4">
        {tables.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <Table2 size={16} /> Tables ({tables.length})
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-3.5">
              {tables.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} onDeleteUnit={onDeleteUnit} onEditRoom={onEditRoom} isDarkMode={isDarkMode} sectionName={section.name} />
              ))}
            </div>
          </div>
        )}

        {roomGroups.map((group) => (
          <div key={group.categoryName}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78716c] dark:text-slate-400">
              <BedDouble size={16} /> {group.categoryName} ({group.units.length})
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-3.5">
              {group.units.map((unit) => (
                <UnitCard key={unit._id || unit.name} unit={unit} onDeleteUnit={onDeleteUnit} onEditRoom={onEditRoom} isDarkMode={isDarkMode} sectionName={section.name} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────── */

export default function TableManagement() {
  const navigate = useNavigate();
  const colors = useSelector((state) => state.admin.theme.colors);
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

  const [newlyAddedSection, setNewlyAddedSection] = useState(null);
  const [newlyAddedUnits, setNewlyAddedUnits] = useState([]);

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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("admin-theme");
      if (savedTheme) return savedTheme === "dark";
    }
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      return root.classList.contains("admin-dark") || root.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => {
      const savedTheme = localStorage.getItem("admin-theme");
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      } else {
        setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
      }
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const handleSuccess = (addedInfo) => {
    setShowForm(false);
    if (addedInfo?.sectionName) {
      setNewlyAddedSection(addedInfo.sectionName);
      setNewlyAddedUnits(addedInfo.units?.map(u => u.name) || []);
    }
  };

  useEffect(() => {
    if (newlyAddedSection && sections.length > 0) {
      const timer = setTimeout(() => {
        let targetEl = null;
        if (newlyAddedUnits.length > 0) {
          const firstUnitName = newlyAddedUnits[0];
          const unitIdStr = `tm-unit-${firstUnitName.replace(/\s+/g, '-').toLowerCase()}`;
          targetEl = document.getElementById(unitIdStr);
        }
        
        if (!targetEl) {
          const secIdStr = `tm-section-${newlyAddedSection.replace(/\s+/g, '-').toLowerCase()}`;
          targetEl = document.getElementById(secIdStr);
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          setNewlyAddedSection(null);
          setNewlyAddedUnits([]);
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [newlyAddedSection, newlyAddedUnits, sections]);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/profile")}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] hover:opacity-90"
            style={{
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
              color: isDarkMode ? colors.primary : colors.primaryText,
            }}
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
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] ${showForm
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "hover:opacity-90"
              }`}
            style={!showForm ? {
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
              color: isDarkMode ? colors.primary : colors.primaryText,
            } : {}}
          >
            {showForm ? <Minus size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Section"}
          </button>
        </div>
        <div className="sm:hidden flex justify-end">
          <button
            onClick={() => setShowForm((p) => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] ${showForm
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "hover:opacity-90"
              }`}
            style={!showForm ? {
              borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
              backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
              color: isDarkMode ? colors.primary : colors.primaryText,
            } : {}}
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
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* SECTIONS LIST (2 columns if form open, else full 3 columns) */}
        <div className={`space-y-4 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* LOADING */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ede8e3] dark:border-slate-600" style={{ borderTopColor: colors.primary }} />
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
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-extrabold shadow-sm transition-all active:scale-[0.97] hover:opacity-90"
                style={{
                  borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                  backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                  color: isDarkMode ? colors.primary : colors.primaryText,
                }}
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
                  isDarkMode={isDarkMode}
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
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  style={{ borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
                    e.currentTarget.style.boxShadow = "none";
                  }}
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
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  style={{ borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
                    e.currentTarget.style.boxShadow = "none";
                  }}
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
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
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
