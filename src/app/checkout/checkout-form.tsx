"use client";

import { useActionState, useRef, useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { checkout, type CheckoutState } from "./actions";
import { captureCheckoutLead } from "@/app/actions/leads";

const initialState: CheckoutState = {};

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(checkout, initialState);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const capturedLeadRef = useRef<string | null>(null);

  // Capture the email as a lead the moment it's entered, before checkout is
  // ever submitted — so someone who fills in their email and then leaves
  // still leaves a real, followable-up-with trace instead of vanishing.
  function onEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
    const email = e.target.value.trim();
    const isDemoPlaceholder = email === "student@example.com";
    if (email && email.includes("@") && !isDemoPlaceholder && capturedLeadRef.current !== email) {
      capturedLeadRef.current = email;
      captureCheckoutLead(email);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue="student@example.com"
          onBlur={onEmailBlur}
          className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name on card</Label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="cc-name"
          placeholder="Jamie Rivera"
          defaultValue="Jamie Rivera"
          className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Card number</Label>
        <div className="relative">
          <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expiry">Expiry</Label>
          <input
            id="expiry"
            name="expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cvc">CVC</Label>
          <input
            id="cvc"
            name="cvc"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="btn-sticker w-full"
      >
        {pending ? "Processing…" : "Complete purchase"}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Demo checkout: this form does not transmit or store real card
        details anywhere.
      </p>
    </form>
  );
}
