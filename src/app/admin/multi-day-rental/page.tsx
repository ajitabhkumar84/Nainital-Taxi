import React from "react";
import MultiDayRentalForm from "@/components/admin/MultiDayRentalForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Day Rental Page | Admin",
  description: "Configure the multi-day car rental landing page",
};

export default function MultiDayRentalAdminPage() {
  return (
    <div className="p-8">
      <MultiDayRentalForm />
    </div>
  );
}
