import { LogoutButtonStyled } from "@/components/dashboard/logout-button";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Settings</h1>
      <LogoutButtonStyled className="w-full" />
    </div>
  );
}
