"use client";

import { CustomButton, SectionTitle } from "@/components";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reset link");
      }

      setMessage(data.message || "If the email exists, a reset link has been sent.");
      toast.success("Reset instructions sent");
    } catch (error: any) {
      toast.error(error.message || "Unable to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <SectionTitle title="Forgot Password" path="Home | Forgot Password" />
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-lg bg-white px-6 py-10 shadow sm:px-12">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              />
            </div>

            <CustomButton
              buttonType="submit"
              text={isSubmitting ? "Sending..." : "Send Reset Link"}
              paddingX={3}
              paddingY={1.5}
              customWidth="full"
              textSize="sm"
            />
          </form>

          {message && (
            <div className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-600">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-blue-600">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
