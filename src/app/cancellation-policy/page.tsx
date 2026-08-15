import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { getSiteContactConfig } from "@/lib/siteContact";

// Static — see the note in src/app/privacy/page.tsx.
export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Nainital Taxi's cancellation and refund tiers — free cancellation up to 7 days before arrival, credit adjustment from 7 days to 1 day, no refund within 24 hours.",
  alternates: { canonical: "/cancellation-policy" },
};

const linkClass = "text-teal-600 hover:text-teal-700 underline underline-offset-2";

const TIERS = [
  {
    when: "Up to 7 days before your arrival/travel date",
    what: "Free cancellation — full refund of any advance paid.",
  },
  {
    when: "7 days to 1 day before your arrival/travel date",
    what: "The advance amount is non-refundable, but is retained as credit, fully adjustable against any future booking with us.",
  },
  {
    when: "Within 24 hours of your arrival/travel date",
    what: "No refund and no credit adjustment.",
  },
];

export default async function CancellationPolicyPage() {
  const contact = await getSiteContactConfig();
  const hasPhone = Boolean(contact.phone);
  const hasEmail = Boolean(contact.email);
  const phone = contact.phone || "our customer support number";
  const email = contact.email || "our support email";

  return (
    <LegalPageLayout title="Cancellation & Refund Policy" lastUpdated="August 2026">
      <div className="space-y-4">
        <p className="text-base text-slate-600 leading-relaxed">
          We understand travel plans can change. Our cancellation policy is designed to be fair
          to both our customers and the drivers and vehicles we reserve on your behalf.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          Cancellation Tiers
        </h2>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[480px] text-left border border-slate-200 text-base text-slate-600">
            <thead>
              <tr className="bg-lake">
                <th className="px-4 py-3 font-display font-semibold text-ink">When you cancel</th>
                <th className="px-4 py-3 font-display font-semibold text-ink">What happens</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => (
                <tr key={tier.when}>
                  <td className="px-4 py-3 border-t border-slate-200 font-medium text-ink">
                    {tier.when}
                  </td>
                  <td className="px-4 py-3 border-t border-slate-200">{tier.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          How to Cancel
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          To cancel or reschedule a booking, contact us as early as possible via phone, WhatsApp,
          or email using the details below &mdash; the sooner you let us know, the more options we
          have to accommodate you.
        </p>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>
            <strong className="text-ink font-medium">Phone</strong>:{" "}
            {hasPhone ? (
              <a href={`tel:${contact.phone}`} className={linkClass}>
                {phone}
              </a>
            ) : (
              phone
            )}
          </li>
          <li>
            <strong className="text-ink font-medium">Email</strong>:{" "}
            {hasEmail ? (
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {email}
              </a>
            ) : (
              email
            )}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          Notes
        </h2>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>
            Credit issued under the 7-day-to-1-day tier does not expire and can be used toward
            any future NainitalTaxi booking.
          </li>
          <li>
            This policy applies to advance payments made at the time of booking. Charges arising
            after a trip has already begun are covered separately under our{" "}
            <Link href="/terms" className={linkClass}>
              Terms of Service
            </Link>
            , including the Trip Cut Short and Breakdown policies.
          </li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
