"use client";

// *********************
// Role of the component: Component that displays all orders on admin dashboard page
// Name of the component: AdminOrders.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <AdminOrders />
// Input parameters: No input parameters
// Output: Table with all orders
// *********************

import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { formatBDT } from "@/helpers/currency";

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusClasses = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "delivered") {
      return "badge-success text-white";
    }

    if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") {
      return "badge-error text-white";
    }

    if (normalizedStatus === "shipped") {
      return "badge-info text-white";
    }

    return "badge-warning text-slate-900";
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const response = await apiClient.get("/api/orders");
      const data = await response.json();
      
      setOrders(data?.orders);
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return <div className="xl:ml-5 w-full max-xl:mt-5 p-6">Loading orders...</div>;
  }

  return (
    <div className="xl:ml-5 w-full max-xl:mt-5 ">
      <h1 className="text-3xl font-semibold text-center mb-5">All orders</h1>
      <div className="overflow-x-auto">
        <table className="table table-md table-pin-cols">
          {/* head */}
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>Order ID</th>
              <th>Name and country</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            {orders && orders.length > 0 &&
              orders.map((order) => (
                <tr key={order?.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>

                  <td>
                    <div>
                      <p className="font-bold">#{order?.id}</p>
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-5">
                      <div>
                        <div className="font-bold">{order?.name}</div>
                        <div className="text-sm opacity-50">{order?.country}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-sm ${getStatusClasses(order?.status)}`}>
                      {order?.status}
                    </span>
                  </td>

                  <td>
                    <p>{formatBDT(order?.total)}</p>
                  </td>

                  <td>{ new Date(Date.parse(order?.dateTime)).toDateString() }</td>
                  <th>
                    <Link
                      href={`/admin/orders/${order?.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      details
                    </Link>
                  </th>
                </tr>
              ))}
          </tbody>
          {/* foot */}
          <tfoot>
            <tr>
              <th></th>
              <th>Order ID</th>
              <th>Name and country</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Date</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
