"use client";
import { AdminDashboardOverview, DashboardSidebar } from "@/components";
import React from "react";

const AdminDashboardPage = () => {
  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="ml-5 w-full max-xl:ml-0 max-xl:px-2 max-xl:mt-5">
        <AdminDashboardOverview />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
