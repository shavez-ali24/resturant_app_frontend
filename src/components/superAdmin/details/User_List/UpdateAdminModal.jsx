"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Mail, Globe, Building, Calendar, Eye, EyeOff, CheckCircle, XCircle, Shield } from "lucide-react"
import { useUpdateUserMutation } from "@/redux/superAdminRedux/superAdminAPI"

export default function UpdateAdminModal({ open, admin, onClose }) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({
    name: "", email: "", domain: "", restaurantName: "", password: "", subscriptionDate: "", role: ""
  })

  useEffect(() => {
    if (admin) {
      // Format date for input field (YYYY-MM-DD)
      const subscriptionDate = admin.subscriptionDate ? 
        new Date(admin.subscriptionDate).toISOString().split('T')[0] : "";
      
      setFormData({
        name: admin.name || "", 
        email: admin.email || "", 
        domain: admin.domain || "",
        restaurantName: admin.restaurantName || "", 
        password: "",
        subscriptionDate: subscriptionDate,
        role: admin.role || ""
      })
      setMessage({ type: '', text: '' })
    }
  }, [admin])

  const showMessage = (text, type = 'success') => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.domain || !formData.restaurantName) {
      showMessage('Please fill all required fields', 'error')
      return
    }

    try {
      const payload = { 
        name: formData.name, 
        email: formData.email, 
        domain: formData.domain, 
        restaurantName: formData.restaurantName,
        role: formData.role
      }
      
      // Add password if provided
      if (formData.password) payload.password = formData.password
      
      // Add subscription date if provided
      if (formData.subscriptionDate) payload.subscriptionDate = formData.subscriptionDate

      // <-- This call now matches the API above
      await updateUser({ userId: admin._id, ...payload }).unwrap();

      showMessage('Admin updated successfully!')
      setTimeout(() => {
        onClose()
        setFormData({ name: "", email: "", domain: "", restaurantName: "", password: "", subscriptionDate: "" })
      }, 1000)

    } catch (error) {
      // error might be a fetchBaseQuery error or thrown message
      const errMsg = error?.data?.message || error?.message || 'Failed to update admin'
      showMessage(errMsg, 'error')
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (message.text) setMessage({ type: '', text: '' })
  }

  const handleClose = () => {
    setMessage({ type: '', text: '' })
    onClose()
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-lg border sm:w-full">
        <DialogHeader>
          <DialogTitle>Update Admin</DialogTitle>
          <DialogDescription>Update admin information and restaurant details</DialogDescription>
        </DialogHeader>
        
        {message.text && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message.type === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="pl-10" required disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="pl-10" required disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="domain" value={formData.domain} onChange={(e) => handleChange("domain", e.target.value)} className="pl-10" required disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="restaurantName" value={formData.restaurantName} onChange={(e) => handleChange("restaurantName", e.target.value)} className="pl-10" required disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscriptionDate">Subscription Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                id="subscriptionDate" 
                type="date" 
                value={formData.subscriptionDate} 
                onChange={(e) => handleChange("subscriptionDate", e.target.value)} 
                className="pl-10" 
                disabled={isLoading} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New Password (Optional)</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={formData.password} 
                onChange={(e) => handleChange("password", e.target.value)} 
                placeholder="Leave blank to keep current password" 
                disabled={isLoading} 
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</> : "Update Admin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}