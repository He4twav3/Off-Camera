import { LogoutButtonStyled } from "@/components/dashboard/logout-button";
import { ntfyTopic, readWhatsAppSettings } from "@/lib/whatsapp-alerts";
import { adminGuard } from "@/lib/admin-guard";
import { PushForm } from "./PushForm";
import { WhatsAppForm } from "./WhatsAppForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const whatsapp = await readWhatsAppSettings();
  // The channel is made only for a signed-in admin past two-step sign-in.
  const topic = (await adminGuard()) ? await ntfyTopic() : await ntfyTopic(true);
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Settings</h1>
      <LogoutButtonStyled className="w-full" />
      <PushForm topic={topic} />
      <WhatsAppForm phone={whatsapp?.phone ?? ""} on={!!whatsapp} />
    </div>
  );
}
