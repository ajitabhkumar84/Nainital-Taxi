import React from "react";
import TrustSectionForm from "@/components/admin/TrustSectionForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Safety Section | Admin",
  description: "Configure the homepage Trust & Safety section",
};

export default function TrustSectionAdminPage() {
  return (
    <div className="p-8">
      <TrustSectionForm />
    </div>
  );
}
