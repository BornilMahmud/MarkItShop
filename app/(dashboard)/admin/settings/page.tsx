import { DashboardSidebar } from "@/components";
import { siteConfig } from "@/lib/site";

const AdminSettingsPage = () => {
  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5 max-xl:mt-5">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Admin Settings</h1>
          <p className="mt-2 text-slate-600">
            MarkitShop configuration summary for the university project setup.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Shop Name</p>
              <p className="text-lg font-semibold text-slate-900">{siteConfig.name}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Admin Email</p>
              <p className="text-lg font-semibold text-slate-900">{siteConfig.adminEmail}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Location</p>
              <p className="text-lg font-semibold text-slate-900">{siteConfig.location}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contact Number</p>
              <p className="text-lg font-semibold text-slate-900">{siteConfig.contactPhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
