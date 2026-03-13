// src/components/superAdmin/AdminsList.jsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Loader2, User, Mail, Calendar, Building, Globe, Clock, Trash2, Plus } from "lucide-react"
import UpdateAdminModal from "./UpdateAdminModal"
import { DeleteConfirmModal } from "@/components/superAdmin/common/deleteConfirmModal"
import { useGetAdminsQuery, useDeleteUserMutation } from "@/redux/superAdminRedux/superAdminAPI"

export default function AdminsList({ onCreateUser }) {
  const { data: adminsData, isLoading, error } = useGetAdminsQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [updateModal, setUpdateModal] = useState({ open: false, admin: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, admin: null })

  const admins = adminsData?.admins || [];

  // Calculate remaining subscription days
  const getRemainingDays = (createdAt) => {
    const createdDate = new Date(createdAt)
    const oneYearLater = new Date(createdDate)
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
    
    const today = new Date()
    const diffTime = oneYearLater - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  // Get subscription status badge
  const getSubscriptionBadge = (days) => {
    if (days > 30) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    } else if (days > 7) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expiring</Badge>
    } else if (days > 0) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
    } else {
      return <Badge className="bg-red-400 text-gray-800 hover:bg-red-400">Expired</Badge>
    }
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  )

  if (error) return (
    <div className="flex justify-center items-center h-64 text-red-500">
      <p>Error loading admins: {error?.message || error?.status || "Unknown error"}</p>
    </div>
  )

  return (
    <>
      <UpdateAdminModal 
        open={updateModal.open}
        admin={updateModal.admin}
        onClose={() => setUpdateModal({ open: false, admin: null })}
      />
      
      <DeleteConfirmModal
        show={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false, admin: null })}
        onConfirm={async () => {
          try {
            await deleteUser(deleteModal.admin._id).unwrap();
            setDeleteModal({ open: false, admin: null });
          } catch (error) {
            console.error("Delete failed:", error);
          }
        }}
        loading={false}
      />
      
      <Card className="overflow-hidden border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
        <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <User className="h-5 w-5 text-orange-600" />
                Admins List
              </CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                Total {admins.length} admin{admins.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            {onCreateUser && (
              <Button
                onClick={onCreateUser}
                className="h-10 rounded-xl border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-white hover:from-orange-600 hover:to-orange-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-orange-700">Admin</TableHead>
                  <TableHead className="text-orange-700">Role</TableHead>
                  <TableHead className="text-orange-700">Contact</TableHead>
                  <TableHead className="text-orange-700">Domain</TableHead>
                  <TableHead className="text-orange-700">Restaurant</TableHead>
                  <TableHead className="text-orange-700">Subscription</TableHead>
                  <TableHead className="text-orange-700">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const remainingDays = getRemainingDays(admin.createdAt)
                  return (
                    <TableRow key={admin._id} className="hover:bg-orange-50/60">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-row gap-2">
                            <div className="font-medium text-gray-900">{admin.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-orange-200 bg-orange-50 text-orange-700">
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-orange-100 text-orange-800">
                          {admin.domain}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {admin.restaurantName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={`font-medium ${
                            remainingDays > 30 ? 'text-green-600' : 
                            remainingDays > 7 ? 'text-yellow-600' : 
                            remainingDays > 0 ? 'text-red-600' : 'text-red-600'
                          }`}>
                            {remainingDays} days
                          </span>
                          {getSubscriptionBadge(remainingDays)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="border-orange-200 bg-white text-gray-700 hover:bg-orange-50" onClick={() => setUpdateModal({ open: true, admin })}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, admin })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {admins.map((admin) => {
              const remainingDays = getRemainingDays(admin.createdAt)
              return (
                <Card key={admin._id} className="border border-orange-100 bg-white/95 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 text-base">{admin.name}</div>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-xs">
                          {admin.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setUpdateModal({ open: true, admin })}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, admin })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <Badge variant="secondary" className="font-mono text-xs bg-orange-100 text-orange-800">
                        {admin.domain}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{admin.restaurantName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className={`font-medium ${
                        remainingDays > 30 ? 'text-green-600' : 
                        remainingDays > 7 ? 'text-yellow-600' : 
                        remainingDays > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {remainingDays} days remaining
                      </span>
                      {getSubscriptionBadge(remainingDays)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Created: {new Date(admin.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {admins.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-orange-300" />
              <p>No admins found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
