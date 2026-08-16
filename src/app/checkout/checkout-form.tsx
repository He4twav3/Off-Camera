"use client";

import { useRef, useState } from "react";
import { CreditCard, Bitcoin, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { captureCheckoutLead } from "@/app/actions/leads";
import { cn } from "@/lib/utils";
import { StripeCardPanel } from "./stripe-card-panel";
import { createCryptoCheckoutAction } from "./actions";

type Method = "card" | "crypto";

export function CheckoutForm() {
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [cryptoPending, setCryptoPending] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const capturedLeadRef = useRef<string | null>(null);

  const emailValid = email.trim().includes("@");

  // Capture the email as a lead the moment it's entered, before checkout
  // is ever completed — so someone who fills in their email and leaves
  // still leaves a real, followable-up-with trace instead of vanishing.
  function onEmailBlur() {
    const trimmed = email.trim();
    if (trimmed && trimmed.includes("@") && capturedLeadRef.current !== trimmed) {
      capturedLeadRef.current = trimmed;
      captureCheckoutLead(trimmed);
    }
  }

  async function payWithCrypto() {
    setCryptoError(null);
    setCryptoPending(true);
    const result = await createCryptoCheckoutAction(email.trim());
    if (result.status === "ready") {
      window.location.href = result.checkoutUrl;
      return;
    }
    setCryptoPending(false);
    setCryptoError(result.status === "error" ? result.error : "Could not start checkout.");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={onEmailBlur}
          className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          Your account and course access go to this address.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border-2 border-ink bg-secondary/40 p-1">
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-colors",
            method === "card"
              ? "pill-outline bg-card"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="size-4" />
          Card
        </button>
        <button
          type="button"
          onClick={() => setMethod("crypto")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-colors",
            method === "crypto"
              ? "pill-outline bg-card"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bitcoin className="size-4" />
          Crypto
        </button>
      </div>

      {method === "card" ? (
        <StripeCardPanel email={email} emailValid={emailValid} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pay with USDT, USDC, BTC, ETH, and more. You&apos;ll be
            redirected to complete payment, then emailed as soon as it&apos;s
            confirmed on-chain.
          </p>
          {cryptoError && (
            <p className="text-sm font-medium text-destructive">{cryptoError}</p>
          )}
          <Button
            type="button"
            size="lg"
            disabled={!emailValid || cryptoPending}
            onClick={payWithCrypto}
            className="btn-sticker w-full"
          >
            {cryptoPending ? "Starting…" : "Continue with crypto"}
          </Button>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Payments are handled by Stripe or NOWPayments — your card or wallet
        details never touch our servers.
      </p>
    </div>
  );
}
