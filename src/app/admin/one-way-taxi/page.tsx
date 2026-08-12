import React from "react";
import { Metadata } from "next";
import OneWayTaxiForm from "@/components/admin/OneWayTaxiForm";

export const metadata: Metadata = {
  title: "One-Way Taxi Page | Admin",
  description: "Configure the /rates page hero heading, subheading, stat blocks and SEO",
};

export default function OneWayTaxiAdminPage() {
  return (
    <div className="p-8">
      <OneWayTaxiForm />
    </div>
  );
}
