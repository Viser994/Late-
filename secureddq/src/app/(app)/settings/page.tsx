import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { SettingsPanel } from "@/components/app/settings-panel";
import { getOrgContext } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const org = await getOrgContext();
  return (
    <>
      <PageHeader title="Settings" description="Manage your organization, security, and AI preferences." />
      <SettingsPanel orgName={org.name} />
    </>
  );
}
