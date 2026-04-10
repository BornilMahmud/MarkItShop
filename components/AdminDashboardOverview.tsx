"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/api";
import StatsElement from "./StatsElement";
import AdminAnalyticsChart from "./AdminAnalyticsChart";
import { formatBDT } from "@/helpers/currency";
import { toDisplayImageSrc } from "@/helpers/image-url";

interface AnalyticsPoint {
  month: string;
  revenue?: number;
  orders?: number;
  customers?: number;
}

interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalUsers: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  revenueDelta: number;
  orderDelta: number;
  customerDelta: number;
}

interface AnalyticsTopProduct {
  id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  unitsSold: number;
  revenue: number;
  stock: number;
}

interface AnalyticsRecentOrder {
  id: string;
  customerName: string;
  email: string;
  country: string;
  status: string;
  total: number;
  dateTime: string;
  itemsCount: number;
}

interface DashboardAnalytics {
  summary: AnalyticsSummary;
  monthlySales: AnalyticsPoint[];
  userGrowth: AnalyticsPoint[];
  topProducts: AnalyticsTopProduct[];
  recentOrders: AnalyticsRecentOrder[];
}

const getStatusClasses = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "delivered") {
    return "badge-success text-white";
  }

  if (normalizedStatus === "canceled") {
    return "badge-error text-white";
  }

  return "badge-warning text-slate-900";
};

const AdminDashboardOverview = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await apiClient.get("/api/analytics/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (fetchError) {
        setError("Unable to load dashboard analytics right now.");
        toast.error("Unable to load dashboard analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const revenueSeries = useMemo(
    () => analytics?.monthlySales || [],
    [analytics?.monthlySales]
  );
  const customerSeries = useMemo(
    () => analytics?.userGrowth || [],
    [analytics?.userGrowth]
  );

  if (isLoading) {
    return (
      <div className="w-full rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-medium text-slate-700">Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="w-full rounded-md border border-red-200 bg-red-50 p-6 text-red-700">
        {error || "Analytics data could not be loaded."}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsElement
          title="Total Revenue"
          value={formatBDT(analytics.summary.totalRevenue)}
          delta={analytics.summary.revenueDelta}
          subtitle="vs previous month"
        />
        <StatsElement
          title="Orders"
          value={analytics.summary.totalOrders}
          delta={analytics.summary.orderDelta}
          subtitle="vs previous month"
        />
        <StatsElement
          title="Customers"
          value={analytics.summary.totalCustomers}
          delta={analytics.summary.customerDelta}
          subtitle="new growth trend"
        />
        <StatsElement
          title="Active Products"
          value={analytics.summary.activeProducts}
          delta={
            analytics.summary.activeProducts === 0
              ? 0
              : ((analytics.summary.activeProducts -
                  analytics.summary.outOfStockProducts) /
                  analytics.summary.activeProducts) *
                100
          }
          subtitle={`${analytics.summary.outOfStockProducts} out of stock`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminAnalyticsChart
          title="Monthly Sales"
          subtitle="Revenue and order volume over the last six months"
          type="area"
          categories={revenueSeries.map((point) => point.month)}
          series={[
            {
              name: "Revenue",
              data: revenueSeries.map((point) => point.revenue || 0),
            },
            {
              name: "Orders",
              data: revenueSeries.map((point) => point.orders || 0),
            },
          ]}
        />
        <AdminAnalyticsChart
          title="User Growth"
          subtitle="Cumulative customers based on first recorded purchase"
          type="line"
          categories={customerSeries.map((point) => point.month)}
          series={[
            {
              name: "Customers",
              data: customerSeries.map((point) => point.customers || 0),
            },
          ]}
          colors={["#0f172a"]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Top Products</h3>
              <p className="text-sm text-slate-500">Best sellers from the live orders table</p>
            </div>
            <Link href="/admin/products" className="text-sm font-semibold text-blue-600">
              Manage products
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-md">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <Image
                              src={toDisplayImageSrc(product.image)}
                              alt={product.title}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{product.title}</div>
                          <div className="text-sm opacity-60">
                            Stock: {product.stock > 0 ? "Available" : "Out"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.unitsSold}</td>
                    <td>{formatBDT(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Platform Snapshot</h3>
            <p className="text-sm text-slate-500">Live operational counts from the current database</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Registered Users</p>
              <p className="text-2xl font-semibold text-slate-900">
                {analytics.summary.totalUsers}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Out of Stock Products</p>
              <p className="text-2xl font-semibold text-slate-900">
                {analytics.summary.outOfStockProducts}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Low Stock Alerts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {analytics.summary.lowStockProducts}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recent Orders Monitored</p>
              <p className="text-2xl font-semibold text-slate-900">
                {analytics.recentOrders.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Recent Orders</h3>
            <p className="text-sm text-slate-500">Orders flowing through the existing checkout pipeline</p>
          </div>
          <Link href="/admin/orders" className="text-sm font-semibold text-blue-600">
            View all orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-md">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="font-bold">{order.customerName}</div>
                    <div className="text-sm opacity-60">{order.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.itemsCount}</td>
                  <td>{formatBDT(order.total)}</td>
                  <td>
                    {order.dateTime
                      ? new Date(order.dateTime).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
