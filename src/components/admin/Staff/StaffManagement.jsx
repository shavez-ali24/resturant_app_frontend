"use client";
import React, { useState } from "react";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
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
import { Plus, Users, Search, Eye, EyeOff, X } from "lucide-react";
import NotificationModal from "../common/NotificationModal";
import Heading from "../common/Heading";

const StaffManagement = () => {
  const { data: staffData, isLoading } = useGetStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeNotification = () => {
    setNotification({ show: false, type: "", message: "" });
  };

  const handleAddNew = () => {
    setFormData({ name: "", email: "", password: "" });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.password) {
      setNotification({
        show: true,
        type: "error",
        message: "Please fill all fields",
      });
      return;
    }
    
    try {
      await createStaff(formData).unwrap();
      setNotification({
        show: true,
        type: "success",
        message: "Staff created successfully!",
      });
      handleCloseModal();
    } catch (error) {
      console.error("Staff creation error:", error);
      setNotification({
        show: true,
        type: "error",
        message: error?.data?.message || error?.message || "Something went wrong",
      });
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
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
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Plus className="text-orange-600" size={20} />
                </div>
                Add New Staff
              </h2>
            </div>
            
            {/* Form */}
            <div className="px-6 pb-6 space-y-4">
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
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
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
                disabled={isCreating}
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300 flex-1"
              >
                {isCreating ? "Creating..." : "Create Staff"}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Users className="animate-pulse" />
                    Loading staff...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
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
                          : "bg-blue-100 text-blue-700"
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
