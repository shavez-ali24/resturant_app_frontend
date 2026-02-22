import { useState } from "react"
import AdminsList from "@/components/superAdmin/details/User_List/AdminsList"
import { RegisterUserForm } from "@/components/superAdmin/details/Create_User/Register_user_form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AdminsPage() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <AdminsList onCreateUser={() => setIsCreateUserOpen(true)} />

      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="w-[calc(100vw-1.25rem)] max-h-[86dvh] max-w-3xl gap-0 overflow-hidden rounded-2xl border border-orange-100 bg-white/95 p-0 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)]">
          <DialogHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/70 px-4 py-3 text-left sm:px-5 sm:py-4">
            <DialogTitle className="text-orange-950">Create New User</DialogTitle>
            <DialogDescription className="text-orange-700/80">
              Fill details to create admin, staff, user, or superadmin account.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(86dvh-84px)] overflow-y-auto p-3 sm:p-4">
            <RegisterUserForm
              hideHeading
              compact
              onSuccess={() => setIsCreateUserOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
