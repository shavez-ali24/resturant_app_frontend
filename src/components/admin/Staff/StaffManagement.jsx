"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from "@/redux/adminRedux/adminAPI";
import {
  Plus,
  Users,
  Search,
  Eye,
  EyeOff,
  X,
  SquarePen,
  Trash,
  ArrowLeft,
} from "lucide-react";
import Heading from "../common/Heading";
import { useNotify } from "../common/NotificationModal";
import { useAdminTour } from "../../../hooks/useAdminTour";
import { TOUR_KEYS, getStaffSteps } from "../../../utils/adminTour";

const StaffManagement = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return root.classList.contains("admin-dark") || root.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () =>
      setIsDarkMode(root.classList.contains("admin-dark") || root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useAdminTour(TOUR_KEYS.staff, getStaffSteps, isDarkMode, 700);

  const navigate = useNavigate();
  const { data: staffData, isLoading, refetch } = useGetStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const notify = useNotify();

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState("");

  const colors = useSelector((state) => state.admin.theme.colors);

  // ── theme helpers ──────────────────────────────────────────────────────────
  const bg      = isDarkMode ? "bg-[#0f172a]"  : "bg-[#fbfaf8]";
  const card    = isDarkMode ? "border-slate-700 bg-[#1e293b]" : "border-[#ede8e3] bg-white";
  const tp      = isDarkMode ? "text-slate-100" : "text-[#1c1917]";
  const ts      = isDarkMode ? "text-slate-400" : "text-[#78716c]";
  const divider = isDarkMode ? "border-slate-700" : "border-[#ede8e3]";
  const inputCls = `h-9 w-full rounded-lg border px-3 text-sm outline-none transition-all ${
    isDarkMode
      ? "border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500"
      : "border-[#ede8e3] bg-white text-[#1c1917] placeholder-[#a8a29e]"
  }`;
  const rowHover = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-[#faf7f4]";
  const rowBorder = isDarkMode ? "border-slate-700" : "border-[#f0ebe5]";

  const inputBaseStyle = {
      borderColor: isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3",
  };
  const handleInputFocus = (e) => {
      e.currentTarget.style.borderColor = colors.primary;
      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
  };
  const handleInputBlur = (e) => {
      e.currentTarget.style.borderColor = isDarkMode ? "rgb(71, 85, 105)" : "#ede8e3";
      e.currentTarget.style.boxShadow = "none";
  };

  const btnStyle = {
      borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
      backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
      color: isDarkMode ? colors.primary : colors.primaryText,
  };
  const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}35` : `${colors.primary}22`;
  };
  const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = isDarkMode ? `${colors.primary}20` : colors.primaryLight;
  };

  // ── input handlers ─────────────────────────────────────────────────────────
  const sanitizeNameInput  = (v = "") => String(v).replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
  const sanitizeEmailInput = (v = "") => String(v).replace(/\s+/g, "").toLowerCase();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const next = name === "name" ? sanitizeNameInput(value) : name === "email" ? sanitizeEmailInput(value) : value;
    setFormData((p) => ({ ...p, [name]: next }));
    if (formError) setFormError("");
  };

  const handleAddNew = () => {
    setFormData({ name: "", email: "", password: "" });
    setFormError(""); setIsEditing(false); setSelectedStaff(null); setShowModal(true);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff); setFormError("");
    setFormData({ name: staff.name || "", email: staff.email || "", password: "" });
    setIsEditing(true); setShowModal(true);
  };

  const handleDeleteClick = (staff) => { setStaffToDelete(staff); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff(staffToDelete._id).unwrap();
      refetch(); notify("Staff deleted successfully!", "success");
      setShowDeleteModal(false); setStaffToDelete(null);
    } catch (err) {
      notify(err?.data?.message || err?.message || "Something went wrong", "error");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false); setIsEditing(false); setSelectedStaff(null);
    setFormData({ name: "", email: "", password: "" }); setFormError("");
  };

  const handleSubmit = async () => {
    const name  = String(formData.name || "").replace(/\s+/g, " ").trim();
    const email = sanitizeEmailInput(formData.email || "");
    if (!name || !email) { setFormError("Please fill all required fields"); return; }
    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)) { setFormError("Name can contain only letters and spaces"); return; }
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@gmail\.com$/i.test(email)) { setFormError("Please enter a valid Gmail address"); return; }
    if (!isEditing && !formData.password) { setFormError("Password is required for new staff"); return; }
    try {
      if (isEditing && selectedStaff) {
        const upd = { name, email };
        if (formData.password) upd.password = formData.password;
        await updateStaff({ staffId: selectedStaff._id, updatedData: upd }).unwrap();
        refetch(); notify("Staff updated successfully!", "success");
      } else {
        await createStaff({ ...formData, name, email }).unwrap();
        refetch(); notify("Staff created successfully!", "success");
      }
      handleCloseModal();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || "Something went wrong");
    }
  };

  const staff = Array.isArray(staffData) ? staffData : [];
  const filteredStaff = staff.filter(
    (m) => m?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           m?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="flex h-full flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4 md:px-6 animate-in fade-in duration-300"
      style={{ backgroundColor: isDarkMode ? "#0f172a" : (colors.pageBg || "#fbfaf8") }}
    >

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px]" onClick={handleCloseModal} />
          <div className={`relative z-10 w-full max-w-md rounded-2xl border shadow-xl ${card}`}>
            {/* Close */}
            <button onClick={handleCloseModal} className={`absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:bg-slate-700 hover:text-slate-100" : "text-[#a8a29e] hover:bg-[#f7f3ef] hover:text-[#1c1917]"}`}>
              <X size={18} />
            </button>
            {/* Header */}
            <div className={`rounded-t-2xl border-b p-5 pb-4 ${divider} ${isDarkMode ? "bg-slate-800/60" : "bg-[#f7f3ef]"}`}>
              <h2 className={`flex items-center gap-2.5 text-lg font-semibold ${tp}`}>
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm shrink-0"
                  style={{
                    borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                    backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                    color: colors.primary
                  }}
                >
                  {isEditing ? <SquarePen size={16} /> : <Plus size={16} />}
                </div>
                {isEditing ? "Edit Staff" : "Add New Staff"}
              </h2>
            </div>
            {/* Form */}
            <div className="space-y-4 px-5 py-4">
              {formError && (
                <div className={`rounded-lg border p-3 text-sm ${isDarkMode ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                  {formError}
                </div>
              )}
              {[
                { id: "name",  label: "Name",  type: "text",  placeholder: "Enter staff name" },
                { id: "email", label: "Email", type: "email", placeholder: "Enter staff email" },
              ].map(({ id, label, type, placeholder }) => (
                <div key={id} className="space-y-1.5">
                  <label htmlFor={id} className={`block text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>{label}</label>
                  <input 
                    id={id} 
                    name={id} 
                    type={type} 
                    value={formData[id]} 
                    onChange={handleInputChange} 
                    placeholder={placeholder} 
                    className={inputCls} 
                    style={inputBaseStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label htmlFor="password" className={`block text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`}>
                  {isEditing ? "New Password (optional)" : "Password"}
                </label>
                <div className="relative">
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder={isEditing ? "Leave blank to keep current" : "Enter password"} 
                    className={`${inputCls} pr-10`} 
                    style={inputBaseStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-100" : "text-[#a8a29e] hover:text-[#1c1917]"}`}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className={`flex gap-3 rounded-b-2xl border-t px-5 py-4 ${divider} ${isDarkMode ? "bg-slate-800/40" : "bg-[#f7f3ef]"}`}>
              <button onClick={handleCloseModal} className={`h-9 flex-1 rounded-lg border text-sm font-semibold transition-colors ${isDarkMode ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"}`}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
                className="h-9 flex-1 rounded-lg border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                style={btnStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {isCreating || isUpdating ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Staff" : "Create Staff")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.45)] ${card}`}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="text-red-600" size={28} />
              </div>
              <h3 className={`mb-2 text-lg font-semibold ${tp}`}>Delete Staff</h3>
              <p className={`mb-6 text-sm ${ts}`}>
                Are you sure you want to delete{" "}
                <span className={`font-semibold ${tp}`}>{staffToDelete?.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className={`h-9 flex-1 rounded-lg border text-sm font-semibold transition-colors ${isDarkMode ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-[#ede8e3] bg-white text-[#78716c] hover:bg-[#f7f3ef]"}`}>
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className="h-9 flex-1 rounded-lg bg-red-500 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header: Title + Search + Total + Add ── */}
      <div data-tour="staff-heading" className={`mb-4 shrink-0 rounded-2xl border p-3 sm:p-4 ${card}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: back button + title + total */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/profile")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 shadow-sm shrink-0"
              style={btnStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              title="Back to Profile"
            >
              <ArrowLeft size={16} />
            </button>
            <Heading title="Staff Management" />
            <span 
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold"
              style={{
                borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                color: isDarkMode ? colors.primary : colors.primaryText,
              }}
            >
              {filteredStaff.length}
            </span>
          </div>

          {/* Right: search + add */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-400" : "text-[#a8a29e]"}`} />
              <input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-8`}
                style={inputBaseStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
            <button
              data-tour="staff-add-btn"
              onClick={handleAddNew}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-5 text-sm font-semibold transition-colors shadow-sm"
              style={btnStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div data-tour="staff-list" className={`flex-1 min-h-0 overflow-hidden rounded-2xl border ${card}`}>
        <div className="h-full overflow-y-auto">
          <table className="w-full">
            <thead className={`sticky top-0 z-10 ${isDarkMode ? "bg-slate-800" : "bg-[#f7f3ef]"}`}>
              <tr>
                {["Name", "Email", "Role", "Created At", "Actions"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${ts} ${i === 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-[#f0ebe5]"}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className={`flex items-center justify-center gap-2 text-sm ${ts}`}>
                      <Users size={18} className="animate-pulse" style={{ color: colors.primary }} />
                      Loading staff...
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className={`flex flex-col items-center gap-2 text-sm ${ts}`}>
                      <Users size={36} style={{ color: colors.primary, opacity: 0.3 }} />
                      <p>{searchTerm ? "No staff found matching your search." : "No staff members yet. Add your first one."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member._id} className={`transition-colors ${rowHover}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight }}
                        >
                          <Users size={14} style={{ color: colors.primary }} />
                        </div>
                        <span className={`text-sm font-medium ${tp}`}>{member.name}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${ts}`}>{member.email}</td>
                    <td className="px-4 py-3">
                      <span 
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}33`,
                          backgroundColor: isDarkMode ? `${colors.primary}20` : colors.primaryLight,
                          color: isDarkMode ? colors.primary : colors.primaryText,
                        }}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${ts}`}>
                      {new Date(member.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(member)} 
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" 
                          aria-label="Edit" 
                          title="Edit staff"
                        >
                          <SquarePen size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(member)} 
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors" 
                          aria-label="Delete" 
                          title="Delete staff"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
