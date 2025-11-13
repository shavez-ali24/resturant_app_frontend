// src/components/superAdmin/AdminsList.jsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Loader2, User, Mail, Calendar, Building, Globe, Clock } from "lucide-react"
import UpdateAdminModal from "./UpdateAdminModal"
import { useGetAdminsQuery } from "@/redux/superAdminRedux/superAdminAPI"

export default function AdminsList() {
  const { data: adminsData, isLoading, error } = useGetAdminsQuery();
  const [updateModal, setUpdateModal] = useState({ open: false, admin: null })

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
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <>
      <UpdateAdminModal 
        open={updateModal.open}
        admin={updateModal.admin}
        onClose={() => setUpdateModal({ open: false, admin: null })}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admins List
          </CardTitle>
          <CardDescription>
            Total {admins.length} admin{admins.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const remainingDays = getRemainingDays(admin.createdAt)
                  return (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-row gap-2">
                            <div className="font-medium text-gray-900">{admin.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
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
                        <Button variant="outline" size="sm" onClick={() => setUpdateModal({ open: true, admin })}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
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
                <Card key={admin._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 text-base">{admin.name}</div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {admin.role}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setUpdateModal({ open: true, admin })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <Badge variant="secondary" className="font-mono text-xs">
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
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No admins found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}