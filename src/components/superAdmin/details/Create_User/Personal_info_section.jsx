import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export function PersonalInfoSection({ form, compact = false }) {
  const [showPassword, setShowPassword] = useState(false)
  const sectionClassName = compact
    ? "space-y-4 rounded-lg border border-orange-100 bg-white p-3 sm:p-4"
    : "space-y-6 rounded-xl border border-orange-100 bg-white p-4 sm:p-5";
  const headingClassName = compact
    ? "text-base font-semibold text-orange-800"
    : "text-lg font-semibold text-orange-800";
  const gridClassName = compact
    ? "grid grid-cols-1 gap-4 md:grid-cols-2"
    : "grid grid-cols-1 gap-6 md:grid-cols-2";
  const descriptionClassName = compact ? "text-xs" : "";

  return (
    <div className={sectionClassName}>
      <h3 className={headingClassName}>Personal Information</h3>
      
      <div className={gridClassName}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Full Name *</FormLabel>
            <FormControl>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                <Input placeholder="Enter full name" {...field} className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Email Address *</FormLabel>
            <FormControl>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                <Input type="email" placeholder="Enter email address" {...field} className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="password" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700">Password *</FormLabel>
          <FormControl>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password" 
                {...field} 
                className="pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-orange-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormControl>
          <FormDescription className={descriptionClassName}>Password must be at least 5 characters long</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  )
}
