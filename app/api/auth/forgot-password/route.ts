import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";

const RESET_TOKEN_EXPIRY_MS = 1000 * 60 * 30;

export const POST = async (request: Request) => {
  try {
    const { email } = await request.json();
    const normalizedEmail = `${email || ""}`.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json({
        message: "If the email exists in our system, a reset link has been generated.",
      });
    }

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const origin = new URL(request.url).origin;
    const resetBaseUrl = process.env.RESET_PASSWORD_BASE_URL || process.env.NEXTAUTH_URL || origin;
    const resetUrl = `${resetBaseUrl}/reset-password?token=${token}`;

    console.log(`[password-reset] ${normalizedEmail} -> ${resetUrl}`);

    return NextResponse.json({
      message: "If the email exists in our system, a reset link has been generated.",
      previewUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to process forgot password request" },
      { status: 500 }
    );
  }
};
