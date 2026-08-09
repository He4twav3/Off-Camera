import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SymbolField } from "@/components/marketing/symbol-field";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Fixed to the viewport, not the document, so it reads as depth
          behind every section from the hero down to the footer, at any
          scroll position, rather than a band that ends partway down. Opaque
          section backgrounds (the stats strip, the CTA block) naturally
          cover it locally, which is fine, it's a page texture, not content. */}
      <SymbolField className="fixed inset-0 -z-10" />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
