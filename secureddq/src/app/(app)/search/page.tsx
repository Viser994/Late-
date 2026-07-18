import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { GlobalSearch } from "@/components/app/global-search";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <PageHeader title="Search" description="AI-powered semantic search across your entire workspace." />
      <GlobalSearch />
    </>
  );
}
