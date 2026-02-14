// src/components/superAdmin/RegisterUserForm.jsx
"use client"

import { useState } from "react"
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
  domain: z.string().min(3, "Domain must be at least 3 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Domain can only contain letters, numbers, and hyphens")
    .optional(),
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

export function RegisterUserForm() {
  const [register, { isLoading }] = useRegisterUserMutation();
  const notify = useNotify();
  const [selectedRole, setSelectedRole] = useState("");

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

  const onSubmit = async (data) => {
    try {
      await register(data).unwrap();
      notify("User created successfully!", "success");
      form.reset();
      setSelectedRole("");
    } catch (error) {
      notify(error?.data?.message || error?.message || "Registration failed", "error");
    }
  };

  const handleRoleChange = (value) => {
    form.setValue("role", value);
    setSelectedRole(value);
  };

  return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Register New User</h2>
          <p className="text-gray-600 mt-2">Create a new user account with role selection</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <PersonalInfoSection form={form} />
            <RoleSection form={form} onRoleChange={handleRoleChange} />
            
            {/* Show restaurant fields only when admin role is selected */}
            {selectedRole === "admin" && (
              <RestaurantInfoSection form={form} />
            )}

            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="w-auto min-w-[200px]" 
                disabled={isLoading} 
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating {selectedRole || "User"}...
                  </>
                ) : (
                  `Register ${selectedRole || "User"}`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
  )
}
