import React from "react";
import ContactPageForm from "@/components/admin/ContactPageForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us Page | Admin",
  description:
    "Configure the contact page SEO, hero, enquiry form, contact cards, map, operating hours, FAQs and CTA",
};

export default function ContactPageAdminPage() {
  return (
    <div className="p-8">
      <ContactPageForm />
    </div>
  );
}
