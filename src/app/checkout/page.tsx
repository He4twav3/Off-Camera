import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/lib/site-config";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

const inclusions = [
  "8 core modules, 25 lessons",
  "Pitch & contract templates",
  "Private student community",
  "Lifetime access + future updates",
];

export default function CheckoutPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-secondary/30 px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="card-sticker order-2 h-fit rounded-2xl bg-card p-6 md:order-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Order summary
          </p>
          <h2 className="mt-2 font-heading text-lg font-semibold text-balance">
            Off Camera: Faceless Content &amp; Brand Deals
          </h2>
          <ul className="mt-4 space-y-2">
            {inclusions.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-heading text-2xl font-semibold">
              {siteConfig.price.formatted}
            </span>
          </div>
        </div>

        <div className="card-sticker order-1 rounded-2xl bg-card p-6 md:order-2">
          <h1 className="text-xl font-semibold tracking-tight">Payment details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your purchase to unlock the course.
          </p>
          <div className="mt-6">
            <CheckoutForm />
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/course" className="underline underline-offset-2">
          Back to the course page
        </Link>
      </p>
    </div>
  );
}
