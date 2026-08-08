import React from "react";
import TrustSectionForm from "@/components/admin/TrustSectionForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Page Trust Section | Admin",
  description: "Configure the Why Families Trust Us section shown on individual tour package pages",
};

export default function TourTrustSectionAdminPage() {
  return (
    <div className="p-8">
      <TrustSectionForm
        apiEndpoint="/api/admin/tour-trust-section"
        showImageUploader={false}
        title="Tour Page Trust Section"
      />
    </div>
  );
}
