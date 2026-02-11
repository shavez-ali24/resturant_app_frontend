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
import NotificationModal from "../common/NotificationModal";
import Heading from "../common/Heading";

const StaffManagement = () => {
  const { data: staffData, isLoading, refetch } = useGetStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

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
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [formError, setFormError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formError) setFormError("");
  };

  const closeNotification = () => {
    setNotification({ show: false, type: "", message: "" });
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
      setNotification({
        show: true,
        type: "success",
        message: "Staff deleted successfully!",
      });
      setShowDeleteModal(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error("Staff deletion error:", error);
      setNotification({
        show: true,
        type: "error",
        message: error?.data?.message || error?.message || "Something went wrong",
      });
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
    // Validate form
    if (!formData.name || !formData.email) {
      setFormError("Please fill all required fields");
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
          name: formData.name,
          email: formData.email,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateStaff({ staffId: selectedStaff._id, updatedData: updateData }).unwrap();
        refetch();
        setNotification({
          show: true,
          type: "success",
          message: "Staff updated successfully!",
        });
      } else {
        // Create new staff
        await createStaff(formData).unwrap();
        refetch();
        setNotification({
          show: true,
          type: "success",
          message: "Staff created successfully!",
        });
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
    <div className="bg-gray-50 py-6 px-4 relative bg-gradient-to-r from-orange-50/30 to-orange-100/40 min-h-screen">
      {/* Notification Modal */}
      {notification.show && (
        <NotificationModal
          notification={notification}
          onClose={closeNotification}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10 p-6 ">
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
                  className="border-gray-300 hover:bg-gray-100 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-10">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            {/* Header */}
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 ">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center ">
                  {isEditing ? (
                    <Pencil className="text-orange-600" size={20} />
                  ) : (
                    <Plus className="text-orange-600" size={20} />
                  )}
                </div>
                {isEditing ? "Edit Staff" : "Add New Staff"}
              </h2>
            </div>
            
            {/* Form */}
            <div className="px-6 pb-6 space-y-4">
              {/* Inline Error Message */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter staff name"
                  className="rounded-lg border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter staff email"
                  className="rounded-lg border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-gray-700 font-medium">
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
                    className="rounded-lg border-orange-200 focus:ring-orange-500 focus:border-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="border-gray-300 hover:bg-gray-100 flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300 flex-1"
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

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Heading title="Staff Management" />
          <Button
            onClick={handleAddNew}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
          <Search className="text-orange-500" size={20} />
          <Input
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead className="text-orange-700 font-semibold">Name</TableHead>
              <TableHead className="text-orange-700 font-semibold">Email</TableHead>
              <TableHead className="text-orange-700 font-semibold">Role</TableHead>
              <TableHead className="text-orange-700 font-semibold">Created At</TableHead>
              <TableHead className="text-orange-700 font-semibold text-right">Actions</TableHead>
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
                <TableRow key={member._id} className="hover:bg-orange-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
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
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
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
      <div className="max-w-7xl mx-auto mt-4">
        <p className="text-gray-500 text-sm">
          Total Staff Members:{" "}
          <span className="text-orange-600 font-semibold">{filteredStaff.length}</span>
        </p>
      </div>
    </div>
  );
};

export default StaffManagement;
