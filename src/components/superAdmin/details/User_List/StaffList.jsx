// src/components/superAdmin/StaffList.jsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Loader2, User, Mail, Calendar, Building, Clock, Trash2 } from "lucide-react"
import { DeleteConfirmModal } from "@/components/superAdmin/common/deleteConfirmModal"
import { useGetStaffQuery, useDeleteUserMutation, useUpdateUserMutation } from "@/redux/superAdminRedux/superAdminAPI"

export default function StaffList() {
  const { data: staffData, isLoading, error } = useGetStaffQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteModal, setDeleteModal] = useState({ open: false, staff: null })
  const [editModal, setEditModal] = useState({ open: false, staff: null })
  const [message, setMessage] = useState({ type: '', text: '' })

  const staff = staffData?.staff || [];

  const showMessage = (text, type = 'success') => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteModal.staff._id).unwrap();
      showMessage('Staff deleted successfully!', 'success')
      setDeleteModal({ open: false, staff: null });
    } catch (error) {
      const errMsg = error?.data?.message || error?.message || 'Failed to delete staff'
      showMessage(errMsg, 'error')
    }
  }

  const handleStatusToggle = async (staffMember) => {
    try {
      const newStatus = staffMember.isActive === false ? true : false;
      await updateUser({ userId: staffMember._id, isActive: newStatus }).unwrap();
      showMessage(`Staff ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success')
    } catch (error) {
      const errMsg = error?.data?.message || error?.message || 'Failed to update status'
      showMessage(errMsg, 'error')
    }
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  if (error) return (
    <div className="flex justify-center items-center h-64 text-red-500">
      <p>Error loading staff: {error?.message || error?.status || "Unknown error"}</p>
    </div>
  )

  return (
    <>
      {message.text && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          message.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message.text}
        </div>
      )}

      <DeleteConfirmModal
        show={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false, staff: null })}
        onConfirm={handleDelete}
        loading={false}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Staff List
          </CardTitle>
          <CardDescription>
            Total {staff.length} staff{staff.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((staffMember) => (
                  <TableRow key={staffMember._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">{staffMember.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {staffMember.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        {staffMember.email}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {staffMember.restaurantId?.restaurantName || staffMember.restaurantName || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusToggle(staffMember)}
                        className={staffMember.isActive === false ? "text-red-600" : "text-green-600"}
                      >
                        {staffMember.isActive === false ? "Inactive" : "Active"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(staffMember.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50" 
                          onClick={() => setDeleteModal({ open: true, staff: staffMember })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {staff.map((staffMember) => (
              <Card key={staffMember._id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-gray-900 text-base">{staffMember.name}</div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {staffMember.role}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50" 
                    onClick={() => setDeleteModal({ open: true, staff: staffMember })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{staffMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{staffMember.restaurantId?.restaurantName || staffMember.restaurantName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStatusToggle(staffMember)}
                      className={staffMember.isActive === false ? "text-red-600 p-0 h-auto" : "text-green-600 p-0 h-auto"}
                    >
                      {staffMember.isActive === false ? "Inactive" : "Active"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Created: {new Date(staffMember.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {staff.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No staff found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
