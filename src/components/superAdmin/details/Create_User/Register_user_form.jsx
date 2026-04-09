// src/components/superAdmin/RegisterUserForm.jsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { useNotify } from "../../common/notificationModal"
import { PersonalInfoSection } from "./Personal_info_section"
import { RestaurantInfoSection } from "./Restaurant-info-section"
import { RoleSection } from "./Role_section"
import { useRegisterUserMutation } from "@/redux/superAdminRedux/superAdminAPI"

// Updated schema with all roles
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  role: z.enum(["admin", "staff", "superadmin", "user"], {
    required_error: "Please select a role",
  }),
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .regex(/\.com$/i, "Domain must end with .com"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters").optional()
}).refine((data) => {
  if (data.role === "admin") {
    return data.domain && data.domain.length >= 3 && data.restaurantName && data.restaurantName.length >= 2
  }
  return true
}, {
  message: "Domain and restaurant name are required for admin role",
  path: ["domain"]
})

export function RegisterUserForm({ onSuccess, hideHeading = false, compact = false }) {
  const [register, { isLoading }] = useRegisterUserMutation();
  const notify = useNotify();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      domain: "",
      restaurantName: "",
    },
  });

  // Watch role field to show/hide restaurant fields
  const watchedRole = form.watch("role");

  const onSubmit = async (data) => {
    try {
      // Clean up data based on role - remove unnecessary fields
      const cleanedData = { ...data };
      
      // For non-admin roles, remove domain and restaurantName
      if (data.role !== "admin") {
        delete cleanedData.domain;
        delete cleanedData.restaurantName;
      }
      
      await register(cleanedData).unwrap();
      notify("User created successfully!", "success");
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      notify(error?.data?.message || error?.message || "Registration failed", "error");
    }
  };

  const handleRoleChange = (value) => {
    form.setValue("role", value);
  };

  const containerClassName = compact ? "w-full" : "mx-auto w-full max-w-2xl";
  const formClassName = compact
    ? "space-y-4 rounded-xl border border-orange-100 bg-orange-50/40 p-3 sm:p-4"
    : "space-y-8 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 sm:p-6";

  return (
      <div className={containerClassName}>
        {!hideHeading && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Register New User</h2>
            <p className="text-gray-600 mt-2">Create a new user account with role selection</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={formClassName}>
            <PersonalInfoSection form={form} compact={compact} />
            <RoleSection form={form} onRoleChange={handleRoleChange} compact={compact} />
            
            {/* Show restaurant fields only when admin role is selected */}
            {watchedRole === "admin" && (
              <RestaurantInfoSection form={form} compact={compact} />
            )}

            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="w-auto min-w-[200px] rounded-xl border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white hover:from-orange-600 hover:to-orange-700" 
                disabled={isLoading} 
                size={compact ? "default" : "lg"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating {watchedRole || "User"}...
                  </>
                ) : (
                  `Register ${watchedRole || "User"}`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
  )
}
