import type { Metadata } from "next";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { getSiteContactConfig } from "@/lib/siteContact";

// Static — see the note in src/app/privacy/page.tsx.
export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Booking, billing, breakdown, and on-tour safety rules that apply to every Nainital Taxi trip.",
  alternates: { canonical: "/terms" },
};

const linkClass = "text-teal-600 hover:text-teal-700 underline underline-offset-2";

export default async function TermsOfServicePage() {
  const contact = await getSiteContactConfig();
  const hasPhone = Boolean(contact.phone);
  const hasEmail = Boolean(contact.email);
  const phone = contact.phone || "our customer support number";
  const email = contact.email || "our support email";

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="August 2026">
      <div className="space-y-4">
        <p className="text-base text-slate-600 leading-relaxed">
          These Terms of Service (&ldquo;Terms&rdquo;) govern every booking made with
          NainitalTaxi. By booking a taxi, tour, or multi-day rental with us, you agree to the
          following terms.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          1. Multi-Day Rental Billing
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          When a vehicle is hired for a multi-day tour, charges apply for the{" "}
          <strong className="text-ink font-medium">complete scheduled itinerary as booked</strong>,
          regardless of whether every day is fully utilised.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          2. Trip Cut Short
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          If, for personal reasons or due to natural events/weather, you choose to end your trip
          early while at a remote location, the following charges apply:
        </p>
        <ol className="list-decimal ml-6 space-y-2 text-base text-slate-600">
          <li>The one-way fare from that location back to the Kathgodam Station drop-off point, plus</li>
          <li>One additional day&rsquo;s charge, to cover the business loss from the unused remainder of the booking.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          3. Vehicle Breakdown Policy
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          In the rare event of a vehicle breakdown during your tour:
        </p>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>
            If the breakdown occurs within a{" "}
            <strong className="text-ink font-medium">1-hour radius of Kathgodam</strong>, we will
            arrange a replacement vehicle within approximately{" "}
            <strong className="text-ink font-medium">1 hour</strong>.
          </li>
          <li>
            If the breakdown occurs further away, a replacement vehicle may take{" "}
            <strong className="text-ink font-medium">2 to 3 hours</strong> to arrive, depending on
            location and road conditions.
          </li>
          <li>
            No deductions, discounts, or refunds are applicable for the wait time caused by a
            breakdown &mdash; our team works to minimise the delay, but hill terrain and travel
            time are outside our control.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          4. Alcohol Policy
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Consuming alcohol inside the vehicle is{" "}
          <strong className="text-ink font-medium">strictly prohibited</strong> at all times,
          whether the vehicle is moving or stationary.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          5. Prohibited Items
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Carrying illegal items or substances of any kind in the vehicle is{" "}
          <strong className="text-ink font-medium">strictly prohibited</strong>. Should a
          passenger be found in possession of any such items, they assume{" "}
          <strong className="text-ink font-medium">sole legal and financial responsibility</strong>,
          and NainitalTaxi bears no liability.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          6. Speed &amp; Safety
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Passengers must not request or pressure the driver to exceed the prescribed speed
          limits on hill roads. Our drivers follow safe hill-driving speeds for the safety of all
          passengers, and this will not be compromised on request.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          7. Night Driving
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          For safety reasons, night driving in hill areas is avoided wherever possible.
          Itineraries are planned to reach destinations before nightfall; we appreciate your
          cooperation in keeping to agreed schedules.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          8. Driver Safety &mdash; If You Suspect Impairment
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Your safety is our top priority. If at any point you suspect the driver is under the
          influence of alcohol or any intoxicating substance:
        </p>
        <ol className="list-decimal ml-6 space-y-2 text-base text-slate-600">
          <li>Call the NainitalTaxi office immediately.</li>
          <li>
            Use any reasonable excuse (a bathroom break, a photo stop, refreshments) to ask the
            driver to stop at the nearest dhaba, restaurant, or public/safe location.
          </li>
          <li>
            Once stopped, wait there &mdash; do{" "}
            <strong className="text-ink font-medium">not</strong> continue the journey with that
            driver.
          </li>
        </ol>
        <p className="text-base text-slate-600 leading-relaxed">
          We will immediately dispatch a replacement vehicle and take appropriate action
          regarding the driver. This protocol exists for your safety and we take every report
          seriously.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          9. General
        </h2>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>These Terms are governed by the laws of India, with courts in Uttarakhand having jurisdiction over any disputes.</li>
          <li>We reserve the right to update these Terms from time to time; the version in effect at the time of your booking applies to that trip.</li>
          <li>
            Questions about these Terms can be sent to{" "}
            {hasEmail ? (
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {email}
              </a>
            ) : (
              email
            )}{" "}
            or{" "}
            {hasPhone ? (
              <a href={`tel:${contact.phone}`} className={linkClass}>
                {phone}
              </a>
            ) : (
              phone
            )}
            .
          </li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
