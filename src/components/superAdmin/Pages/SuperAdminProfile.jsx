"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Calendar, Building, ShieldCheck, Loader2 } from "lucide-react"

const SuperAdminProfile = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserData(user)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6">
        <Card className="border border-orange-100 bg-white/95 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)]">
          <CardContent className="flex justify-center items-center h-32">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
            Loading profile...
          </CardContent>
        </Card>
      </div>
    )
  }

  const detailCards = [
    {
      label: "Email Address",
      value: userData?.email || "N/A",
      icon: Mail,
    },
    {
      label: "Role",
      value: userData?.role || "superadmin",
      icon: ShieldCheck,
      valueClassName: "capitalize",
    },
    ...(userData?.restaurantName
      ? [
          {
            label: "Restaurant Name",
            value: userData.restaurantName,
            icon: Building,
          },
        ]
      : []),
    ...(userData?.createdAt
      ? [
          {
            label: "Member Since",
            value: new Date(userData.createdAt).toLocaleDateString(),
            icon: Calendar,
          },
        ]
      : []),
  ]

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <Card className="overflow-hidden border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]">
        <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-orange-100/80 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-orange-950">
            <User className="h-6 w-6 text-orange-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-orange-100/50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-xl font-semibold text-white shadow-md">
                  {userData?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-950">{userData?.name || 'Super Admin'}</h2>
                  <p className="text-sm text-orange-700/80">Primary account details</p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {(userData?.role || 'superadmin').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detailCards.map((detail) => {
              const Icon = detail.icon
              return (
                <div key={detail.label} className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2 ring-1 ring-orange-100">
                      <Icon className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-orange-700/80">{detail.label}</p>
                      <p className={`truncate text-sm font-semibold text-orange-950 ${detail.valueClassName || ""}`}>
                        {detail.value}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminProfile
