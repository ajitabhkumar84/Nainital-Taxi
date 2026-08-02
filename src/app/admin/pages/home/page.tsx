import React from "react";
import HomePageContentForm from "@/components/admin/HomePageContentForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Page | Admin",
  description: "Configure the homepage SEO, hero and section headings",
};

export default function HomePageContentAdminPage() {
  return (
    <div className="p-8">
      <HomePageContentForm />
    </div>
  );
}
