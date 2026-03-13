import { RegisterUserForm } from "@/components/superAdmin/details/Create_User/Register_user_form"

export default function CreateUserPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl rounded-2xl border border-orange-100 bg-white/95 px-4 py-5 shadow-[0_14px_32px_-22px_rgba(249,115,22,0.45)] sm:px-6 sm:py-6">
        <RegisterUserForm />
      </div>
    </div>
  )
}
