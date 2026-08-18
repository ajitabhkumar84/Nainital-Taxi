import React from "react";
import PageSeoForm from "@/components/admin/PageSeoForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destinations Page | Admin",
  description: "Configure the SEO title and description for the destinations listing page",
};

export default function DestinationsPageSeoAdminPage() {
  return (
    <div className="p-8">
      <PageSeoForm
        slug="destinations"
        pageLabel="Destinations Page"
        titlePlaceholder="Destinations | Nainital Taxi - Explore Uttarakhand"
        descriptionPlaceholder="Discover beautiful destinations in Uttarakhand. Book taxi services to Kathgodam, Pantnagar, Bhimtal, Mukteshwar, Ranikhet, Jim Corbett and more."
      />
    </div>
  );
}
