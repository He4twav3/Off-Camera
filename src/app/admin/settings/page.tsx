import { LogoutButtonStyled } from "@/components/dashboard/logout-button";
import { readWhatsAppSettings } from "@/lib/whatsapp-alerts";
import { WhatsAppForm } from "./WhatsAppForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const whatsapp = await readWhatsAppSettings();
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Settings</h1>
      <LogoutButtonStyled className="w-full" />
      <WhatsAppForm phone={whatsapp?.phone ?? ""} on={!!whatsapp} />
    </div>
  );
}
