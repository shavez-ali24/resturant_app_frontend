"use client";
import React, { useState } from "react";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from "@/redux/adminRedux/adminAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Search,
  Eye,
  EyeOff,
  X,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
} from "lucide-react";
import Heading from "../common/Heading";
import { useNotify } from "../common/NotificationModal";

const StaffManagement = () => {
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const sanitizeNameInput = (value = "") =>
    String(value)
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s{2,}/g, " ");

  const sanitizeEmailInput = (value = "") =>
    String(value).replace(/\s+/g, "").toLowerCase();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "name"
        ? sanitizeNameInput(value)
        : name === "email"
        ? sanitizeEmailInput(value)
        : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    // Clear error when user types
    if (formError) setFormError("");
  };

  const handleAddNew = () => {
    setFormData({ name: "", email: "", password: "" });
    setFormError("");
    setIsEditing(false);
    setSelectedStaff(null);
    setShowModal(true);
  };

  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setFormError("");
    setFormData({
      name: staff.name || "",
      email: staff.email || "",
      password: "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      await deleteStaff(staffToDelete._id).unwrap();
      refetch();
      notify("Staff deleted successfully!", "success");
      setShowDeleteModal(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error("Staff deletion error:", error);
      notify(error?.data?.message || error?.message || "Something went wrong", "error");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedStaff(null);
    setFormData({ name: "", email: "", password: "" });
    setFormError("");
  };

  const handleSubmit = async () => {
    const normalizedName = String(formData.name || "")
      .replace(/\s+/g, " ")
      .trim();
    const normalizedEmail = sanitizeEmailInput(formData.email || "");
    const validNamePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
    const validGmailPattern =
      /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@gmail\.com$/i;

    // Validate form
    if (!normalizedName || !normalizedEmail) {
      setFormError("Please fill all required fields");
      return;
    }

    if (!validNamePattern.test(normalizedName)) {
      setFormError("Name can contain only letters and spaces");
      return;
    }

    if (!validGmailPattern.test(normalizedEmail)) {
      setFormError("Please enter a valid Gmail address");
      return;
    }

    if (!isEditing && !formData.password) {
      setFormError("Password is required for new staff");
      return;
    }

    try {
      if (isEditing && selectedStaff) {
        // Update existing staff
        const updateData = {
          name: normalizedName,
          email: normalizedEmail,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateStaff({ staffId: selectedStaff._id, updatedData: updateData }).unwrap();
        refetch();
        notify("Staff updated successfully!", "success");
      } else {
        // Create new staff
        await createStaff({
          ...formData,
          name: normalizedName,
          email: normalizedEmail,
        }).unwrap();
        refetch();
        notify("Staff created successfully!", "success");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Staff operation error:", error);
      setFormError(error?.data?.message || error?.message || "Something went wrong");
    }
  };

  const staff = Array.isArray(staffData) ? staffData : [];
  
  // Filter staff by search term
  const filteredStaff = staff.filter(
    (member) =>
      member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30 px-2 py-3 sm:px-4 sm:py-4 md:px-6">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={handleCloseModal}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_20px_45px_-24px_rgba(2,6,23,0.95)]">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-orange-300"
            >
              <X size={20} />
            </button>
            
            {/* Header */}
            <div className="rounded-t-2xl border-b border-orange-100 bg-gradient-to-r from-orange-50/90 via-orange-50 to-white p-6 pb-4 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-slate-800">
                  {isEditing ? (
                    <Pencil className="text-orange-600 dark:text-orange-300" size={20} />
                  ) : (
                    <Plus className="text-orange-600 dark:text-orange-300" size={20} />
                  )}
                </div>
                {isEditing ? "Edit Staff" : "Add New Staff"}
              </h2>
            </div>
            
            {/* Form */}
            <div className="px-6 pb-6 space-y-4">
              {/* Inline Error Message */}
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-gray-700 dark:text-slate-200">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter staff name"
                  className="h-11 rounded-xl border border-orange-200 bg-white text-sm shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-gray-700 dark:text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter staff email"
                  className="h-11 rounded-xl border border-orange-200 bg-white text-sm shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/20"
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="font-medium text-gray-700 dark:text-slate-200">
                  {isEditing ? "New Password (leave blank to keep current)" : "Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isEditing ? "Enter new password" : "Enter password"}
                    className="h-11 rounded-xl border border-orange-200 bg-white pr-10 text-sm shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-orange-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 border-t border-orange-100 bg-gradient-to-r from-orange-50/70 to-white px-6 py-4 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-900">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating || isUpdating
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Staff"
                  : "Create Staff"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 p-6 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 ">Delete Staff</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-700">{staffToDelete?.name}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="h-11 flex-1 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-orange-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:flex-row sm:items-center sm:p-4">
          <Heading title="Staff Management" />
          <Button
            onClick={handleAddNew}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-600"
          >
            <Plus size={18} />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:p-4">
          <Search className="text-gray-500" size={20} />
          <Input
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-xl border border-orange-200 bg-white text-sm shadow-sm outline-none transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[linear-gradient(90deg,#f97316,#ea580c)] hover:bg-[linear-gradient(90deg,#f97316,#ea580c)]">
              <TableHead className="font-semibold text-white">Name</TableHead>
              <TableHead className="font-semibold text-white">Email</TableHead>
              <TableHead className="font-semibold text-white">Role</TableHead>
              <TableHead className="font-semibold text-white">Created At</TableHead>
              <TableHead className="text-right font-semibold text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Users className="animate-pulse" />
                    Loading staff...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Users size={40} className="text-orange-200" />
                    <p>
                      {searchTerm
                        ? "No staff members found matching your search."
                        : "No staff members found. Add your first staff member."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member._id} className="border-b border-orange-100 hover:bg-orange-50/60">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                        <Users size={16} className="text-orange-600" />
                      </div>
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${
                        member.role === "admin"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(member)}
                        className="rounded-lg text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-700"
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total Count */}
      <div className="mx-auto mt-4 max-w-7xl">
        <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white/90 px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Staff Members</p>
          <span className="inline-flex min-w-[44px] justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-extrabold text-orange-700">
            {filteredStaff.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
