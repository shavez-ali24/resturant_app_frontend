import AdminHeader from "@/components/admin/adminLayout/AdminHeader";
import { NotificationProvider } from "@/components/admin/Bell/NotificationContext";

export default function AdminLayout() {
  return (
    <div className=" mx-auto min-h-screen font-mostrate font-semibold ">
      <NotificationProvider>
        <AdminHeader />
      </NotificationProvider>
   </div>
  );
}

