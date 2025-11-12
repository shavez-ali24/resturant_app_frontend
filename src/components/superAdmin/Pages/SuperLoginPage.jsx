// src/components/superAdmin/Pages/SuperLoginPage.jsx
"use client"
import React, { useState } from 'react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { NotificationModal } from '../common/notificationModal'
import { useRegisterMutation } from '@/redux/superAdminRedux/superAdminAPI' // ✅ Fixed import

const SuperLoginPage = () => {
  const [login, { isLoading }] = useRegisterMutation(); // ✅ Fixed hook name
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const navigate = useNavigate()

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type })
  }

  const closeNotification = () => {
    setNotification({ show: false, message: "", type: "" })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = await login(formData).unwrap();

      // The role check is now handled in transformResponse, so we don't need to check here
      showNotification('Login successful! Redirecting...')
      
      // Redirect to super admin dashboard
      setTimeout(() => {
        navigate('/super-admin')
      }, 1000)

    } catch (error) {
      showNotification(error.data?.message || error.message || 'Login failed', "error")
    }
  }

  return (
    <>
      <NotificationModal notification={notification} onClose={closeNotification} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Image */}
            <div className="lg:w-1/2 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center p-8 lg:p-12">
              <div className="text-center text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">Super Admin</h1>
                <p className="text-lg lg:text-xl opacity-90">
                  Restaurant Management System
                </p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Super Admin Login</h2>
                  <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 h-12 text-lg border-gray-300 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 h-12 text-lg border-gray-300 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Login Button */}
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="text-center mt-6 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Only users with <strong>superadmin</strong> role can access this panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SuperLoginPage