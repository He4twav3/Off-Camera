import type { Metadata } from "next";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { BrandResources } from "../BrandParts";

export const metadata: Metadata = { title: "Templates" };

export default function BrandTemplatesPage() {
  return (
    <PageShell>
      <PageHeader title="Templates" />
      <div className="-mt-8">
        <BrandResources />
      </div>
    </PageShell>
  );
}
