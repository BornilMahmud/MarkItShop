"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { formatBDT } from "@/helpers/currency";
import { toDisplayImageSrc } from "@/helpers/image-url";

interface CustomerOrderHistoryItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    mainImage: string;
    price: number;
    manufacturer: string;
  };
}

interface CustomerOrderHistoryOrder extends Order {
  products: CustomerOrderHistoryItem[];
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

const CustomerOrderHistory = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<CustomerOrderHistoryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setInfoMessage("");

        const response = await apiClient.get(
          `/api/orders/history?email=${encodeURIComponent(session.user.email)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setOrders([]);
          setInfoMessage("No previous orders found yet. Place your first order to see it here.");
          return;
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (_error) {
        setOrders([]);
        setInfoMessage("No previous orders found yet. Place your first order to see it here.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [session?.user?.email]);

  if (status === "loading" || isLoading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-medium text-slate-700">Loading your orders...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-medium text-slate-700">
          Please <Link href="/login" className="text-blue-600">sign in</Link> to see your order history.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">No orders yet</h2>
        <p className="mt-2 text-slate-600">
          {infoMessage || "Once you place an order from checkout, it will show up here."}
        </p>
        <Link href="/shop" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-5">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Order #{order.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-slate-500">
                {order.dateTime
                  ? new Date(order.dateTime).toLocaleString()
                  : "Date unavailable"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`badge ${getStatusClasses(order.status)}`}>
                {order.status}
              </span>
              <span className="text-lg font-semibold text-slate-900">
                {formatBDT(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Shipping</h3>
              <p className="text-sm text-slate-600">
                {order.name} {order.lastname}
              </p>
              <p className="text-sm text-slate-600">
                {order.adress}, {order.apartment}
              </p>
              <p className="text-sm text-slate-600">
                {order.city}, {order.country}, {order.postalCode}
              </p>
              <p className="text-sm text-slate-600">{order.phone}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Items</h3>
              {order.products.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Image
                    src={toDisplayImageSrc(item.product.mainImage)}
                    alt={item.product.title}
                    width={56}
                    height={56}
                    className="rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="font-medium text-slate-900"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {item.quantity} x {formatBDT(item.product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerOrderHistory;
