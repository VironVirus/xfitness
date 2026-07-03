"use client";

import { useEffect, useState } from "react";
import type { MemberProfile, PaymentVerification } from "@/types/app";
import { formatNaira } from "@/lib/utils";

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: {
      public_key: string;
      tx_ref: string;
      amount: number;
      currency: string;
      payment_options: string;
      customer: {
        email: string;
        phonenumber: string;
        name: string;
      };
      customizations: {
        title: string;
        description: string;
        logo: string;
      };
      callback: (response: { transaction_id?: number | string }) => Promise<void> | void;
      onclose: () => void;
    }) => void;
  }
}

type PaymentButtonProps = {
  amount: number;
  member: MemberProfile;
  description: string;
  disabled?: boolean;
  onSuccess: (result: PaymentVerification) => Promise<void>;
};

export function PaymentButton({ amount, member, description, disabled, onSuccess }: PaymentButtonProps) {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const [txRef, setTxRef] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setTxRef(`xfitness-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  }, [amount, member.uid, description]);

  async function handleDemoFallback() {
    await onSuccess({
      status: "success",
      paymentState: "paid",
      txRef: txRef || `mock-${Date.now()}`,
      transactionId: `mock-${Date.now()}`
    });
  }

  async function handlePayment() {
    if (!publicKey || typeof window === "undefined" || !window.FlutterwaveCheckout) {
      await handleDemoFallback();
      return;
    }

    setPending(true);
    const siteOrigin = window.location.origin;

    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: txRef,
      amount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: member.email,
        phonenumber: "08000000000",
        name: member.fullName
      },
      customizations: {
        title: "Xfitness Booking",
        description,
        logo: `${siteOrigin}/media/logo-mark.png`
      },
      callback: async (response) => {
        try {
          const deploymentId = process.env.NEXT_DEPLOYMENT_ID;
          const headers: HeadersInit = {
            "Content-Type": "application/json"
          };

          if (deploymentId) {
            headers["x-deployment-id"] = deploymentId;
          }

          const verificationResponse = await fetch("/api/flutterwave/verify", {
            method: "POST",
            headers,
            body: JSON.stringify({ transactionId: response.transaction_id, txRef })
          });

          const payload = (await verificationResponse.json()) as PaymentVerification;
          await onSuccess(payload);
        } finally {
          setPending(false);
        }
      },
      onclose: () => {
        setPending(false);
      }
    });
  }

  return (
    <button type="button" className="button button-primary booking-pay" onClick={handlePayment} disabled={disabled || pending}>
      {pending ? "Confirming..." : `Pay ${formatNaira(amount)}`}
    </button>
  );
}
