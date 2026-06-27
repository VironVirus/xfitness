import { NextResponse } from "next/server";
import type { PaymentVerification } from "@/types/app";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const body = (await request.json()) as { transactionId?: string; txRef?: string };

    if (!secretKey || !body.transactionId) {
      const fallback: PaymentVerification = {
        status: "pending",
        paymentState: "disabled",
        txRef: body.txRef
      };
      return NextResponse.json(fallback);
    }

    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${body.transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`
        },
        cache: "no-store"
      }
    );

    if (!verificationResponse.ok) {
      return NextResponse.json(
        {
          status: "pending",
          paymentState: "pending-verification",
          txRef: body.txRef,
          transactionId: body.transactionId
        } satisfies PaymentVerification,
        { status: 200 }
      );
    }

    const payload = (await verificationResponse.json()) as {
      data?: { status?: string; tx_ref?: string; id?: number | string };
    };

    return NextResponse.json({
      status: payload.data?.status === "successful" ? "success" : "pending",
      paymentState: payload.data?.status === "successful" ? "paid" : "pending-verification",
      txRef: payload.data?.tx_ref ?? body.txRef,
      transactionId: String(payload.data?.id ?? body.transactionId)
    } satisfies PaymentVerification);
  } catch {
    return NextResponse.json(
      {
        status: "pending",
        paymentState: "pending-verification"
      } satisfies PaymentVerification,
      { status: 200 }
    );
  }
}
