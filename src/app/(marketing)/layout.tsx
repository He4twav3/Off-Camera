import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { MarketingThemeScope } from "./theme-scope";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingThemeScope>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </MarketingThemeScope>
  );
}
