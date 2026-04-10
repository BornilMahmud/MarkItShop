"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { formatBDT, SHIPPING_CHARGE_BDT } from "@/helpers/currency";
import { toDisplayImageSrc } from "@/helpers/image-url";

const CheckoutPage = () => {
  const { data: session } = useSession();
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: "",
    phone: "",
    adress: "",
    city: "",
    paymentMethod: "bkash",
    paymentPhone: "",
    transactionId: "",
    orderNotice: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  const validateForm = () => {
    const errors: string[] = [];
    if (!checkoutForm.fullName.trim()) {
      errors.push("Full name is required");
    }
    if (!checkoutForm.phone.trim()) {
      errors.push("Phone number is required");
    }
    if (!checkoutForm.adress.trim()) {
      errors.push("Address is required");
    }
    if (!checkoutForm.city.trim()) {
      errors.push("City is required");
    }
    if (!checkoutForm.paymentMethod.trim()) {
      errors.push("Payment method is required");
    }
    if (!checkoutForm.paymentPhone.trim()) {
      errors.push("Mobile banking number is required");
    }
    if (!checkoutForm.transactionId.trim()) {
      errors.push("Transaction ID is required");
    }
    if (!session?.user?.email) {
      errors.push("Please login to place order and receive email confirmation");
    }
    return errors;
  };

  const makePurchase = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    if (products.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (total <= 0) {
      toast.error("Invalid order total");
      return;
    }

    setIsSubmitting(true);

    try {
      let userId = null;
      if (session?.user?.email) {
        try {
          const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id;
          }
        } catch (_userError) {
          // Keep proceeding without user id; backend can still create order by email.
        }
      }

      const checkoutTotal = total + SHIPPING_CHARGE_BDT;
      const userEmail = `${session?.user?.email || ""}`.trim().toLowerCase();

      const orderData = {
        fullName: checkoutForm.fullName.trim(),
        phone: checkoutForm.phone.trim(),
        email: userEmail,
        adress: checkoutForm.adress.trim(),
        city: checkoutForm.city.trim(),
        paymentMethod: checkoutForm.paymentMethod.trim(),
        paymentPhone: checkoutForm.paymentPhone.trim(),
        transactionId: checkoutForm.transactionId.trim(),
        orderNotice: checkoutForm.orderNotice.trim(),
        total: checkoutTotal,
        userId,
      };

      const response = await apiClient.post("/api/orders/checkout", {
        ...orderData,
        items: products.map((product) => ({
          productId: product.id,
          quantity: product.amount,
        })),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (response.status === 409) {
            toast.error(errorData.details || errorData.error || "Duplicate order detected");
            return;
          } else if (errorData.details && Array.isArray(errorData.details)) {
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else if (typeof errorData.details === "string") {
            toast.error(errorData.details);
          } else {
            toast.error(errorData.error || "Order creation failed");
          }
        } catch (_parseError) {
          toast.error("Order creation failed. Please try again.");
        }

        return;
      }

      const data = await response.json();
      const orderId: string = data.id;

      if (!orderId) {
        throw new Error("Order ID not received from server");
      }

      setCheckoutForm({
        fullName: "",
        phone: "",
        adress: "",
        city: "",
        paymentMethod: "bkash",
        paymentPhone: "",
        transactionId: "",
        orderNotice: "",
      });
      clearCart();

      try {
        window.dispatchEvent(new CustomEvent("orderCompleted"));
      } catch (_error) {
        // ignore refresh event errors
      }

      setCreatedOrderId(orderId);
      setShowConfirmation(true);
      if (data?.emailSent === false) {
        toast.success("Order placed successfully");
        toast.error("Order placed, but confirmation email was not sent. Please contact support.");
      } else {
        toast.success("Order placed successfully. Confirmation email sent.");
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        try {
          const errorData = await error.response.json();
          if (errorData.details && Array.isArray(errorData.details)) {
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else {
            toast.error(errorData.error || "Validation failed");
          }
        } catch (_parseError) {
          toast.error("Validation failed");
        }
      } else if (error.response?.status === 409) {
        toast.error("Duplicate order detected. Please wait before creating another order.");
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, [products.length, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <SectionTitle title="Checkout" path="Home | Cart | Checkout" />
      
      <div className="hidden h-full w-1/2 bg-white lg:block" aria-hidden="true" />
      <div className="hidden h-full w-1/2 bg-gray-50 lg:block" aria-hidden="true" />

      <main className="relative mx-auto grid max-w-screen-2xl grid-cols-1 gap-8 px-4 pb-16 pt-10 lg:grid-cols-2 lg:px-8 xl:gap-x-16">
        <h1 className="sr-only">Order information</h1>

        {/* Order Summary */}
        <section
          aria-labelledby="summary-heading"
          className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-8 lg:max-w-none">
            <h2 id="summary-heading" className="text-xl font-semibold text-slate-900">
              Order summary
            </h2>

            <ul
              role="list"
              className="mt-4 divide-y divide-slate-200 text-sm font-medium text-slate-900"
            >
              {products.map((product) => (
                <li key={product?.id} className="flex items-start space-x-4 py-4">
                  <Image
                    src={toDisplayImageSrc(product?.image)}
                    alt={product?.title}
                    width={80}
                    height={80}
                    className="h-16 w-16 flex-none rounded-lg border border-slate-200 object-cover object-center"
                  />
                  <div className="flex-auto space-y-1">
                    <h3 className="line-clamp-1 text-sm font-semibold">{product?.title}</h3>
                    <p className="text-xs text-slate-500">Qty: {product?.amount}</p>
                  </div>
                  <p className="flex-none text-sm font-semibold text-slate-800">
                    {formatBDT(product?.price)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm font-medium text-slate-900">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd>{formatBDT(total)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Shipping</dt>
                <dd>{formatBDT(SHIPPING_CHARGE_BDT)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                <dt className="text-base font-semibold text-blue-900">Total</dt>
                <dd className="text-base font-bold text-blue-900">
                  {formatBDT(total + SHIPPING_CHARGE_BDT)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <form className="order-2 lg:order-1 lg:col-start-1 lg:row-start-1">
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:max-w-none">
            {/* Shipping Address */}
            <section aria-labelledby="shipping-heading">
              <h2
                id="shipping-heading"
                className="text-xl font-semibold text-slate-900"
              >
                Shipping address
              </h2>

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                We will use your account email ({session?.user?.email || "not logged in"}) to send order confirmation.
              </div>

              <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                Payment system: Mobile Banking (bKash, Nagad, Rocket).
              </div>

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="full-name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Full Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="full-name"
                      name="full-name"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.fullName}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Phone Number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.phone}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Address *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.adress}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          adress: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    City *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.city}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="order-notice"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Order notice
                  </label>
                  <div className="mt-1">
                    <textarea
                      className="textarea textarea-bordered w-full rounded-lg border border-slate-300 bg-white p-3 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      id="order-notice"
                      name="order-notice"
                      autoComplete="order-notice"
                      disabled={isSubmitting}
                      value={checkoutForm.orderNotice}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          orderNotice: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-method"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mobile Banking Method *
                  </label>
                  <div className="mt-1">
                    <select
                      id="payment-method"
                      name="payment-method"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.paymentMethod}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          paymentMethod: e.target.value,
                        })
                      }
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mobile Banking Number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="payment-phone"
                      name="payment-phone"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.paymentPhone}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          paymentPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="transaction-id"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Transaction ID *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="transaction-id"
                      name="transaction-id"
                      required
                      disabled={isSubmitting}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={checkoutForm.transactionId}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          transactionId: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={makePurchase}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
              >
                {isSubmitting ? "Processing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                <path d="M20 7L10 17L4 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-center text-2xl font-bold text-slate-900">Order Confirmed</h3>
            <p className="mt-2 text-slate-600">
              Your order has been placed successfully. A confirmation email has been sent to your account email.
            </p>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Order ID: <span className="font-semibold">{createdOrderId}</span>
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => {
                  setShowConfirmation(false);
                  router.push("/");
                }}
              >
                Continue Shopping
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setShowConfirmation(false);
                  router.push("/orders");
                }}
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
