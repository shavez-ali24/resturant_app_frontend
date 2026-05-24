// src/components/superAdmin/StaffList.jsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Calendar, Building, Trash2 } from "lucide-react"
import { DeleteConfirmModal } from "@/components/superAdmin/common/deleteConfirmModal"
import { useGetStaffQuery, useDeleteUserMutation } from "@/redux/superAdminRedux/superAdminAPI"

export default function StaffList() {
  const { data: staffData, isLoading, error } = useGetStaffQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [deleteModal, setDeleteModal] = useState({ open: false, staff: null })
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

  // NOTE: isActive toggle removed because User model doesn't have an isActive field.
  // To restore this feature, add isActive: Boolean to the User model (backend).

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
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
            : 'bg-orange-50 border border-orange-200 text-orange-800'
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
      
      <Card className="overflow-hidden border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
        <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/70">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <User className="h-5 w-5 text-orange-600" />
            Staff List
          </CardTitle>
          <CardDescription className="text-orange-700/80">
            Total {staff.length} staff{staff.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-orange-700">Staff</TableHead>
                  <TableHead className="text-orange-700">Role</TableHead>
                  <TableHead className="text-orange-700">Contact</TableHead>
                  <TableHead className="text-orange-700">Restaurant</TableHead>
                  <TableHead className="text-orange-700">Created</TableHead>
                  <TableHead className="text-right text-orange-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((staffMember) => (
                  <TableRow key={staffMember._id} className="hover:bg-orange-50/60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-orange-950">{staffMember.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-orange-200 bg-orange-50 text-orange-700">
                        {staffMember.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-orange-900/80">
                        <Mail className="h-4 w-4" />
                        {staffMember.email}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-orange-900/90">
                      {staffMember.restaurantId?.restaurantName || staffMember.restaurantName || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-orange-700/80">
                        <Calendar className="h-4 w-4" />
                        {new Date(staffMember.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-200 text-red-600 hover:bg-red-50" 
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
              <Card key={staffMember._id} className="border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-orange-950 text-base">{staffMember.name}</div>
                      <Badge variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-700">
                        {staffMember.role}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-200 text-red-600 hover:bg-red-50" 
                    onClick={() => setDeleteModal({ open: true, staff: staffMember })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-orange-900/80">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{staffMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-900/80">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{staffMember.restaurantId?.restaurantName || staffMember.restaurantName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-700/80">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Created: {new Date(staffMember.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {staff.length === 0 && (
            <div className="text-center py-12 text-orange-700/80">
              <User className="h-12 w-12 mx-auto mb-4 text-orange-300" />
              <p>No staff found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
