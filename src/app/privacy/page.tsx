import type { Metadata } from "next";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { getSiteContactConfig } from "@/lib/siteContact";

// Static — this page's copy doesn't come from the database, so there's
// nothing for a generateMetadata() request to fetch. A plain export lets
// Next.js prerender the route instead of running a function per request.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Nainital Taxi collects, uses, and protects your information, plus our website's intellectual property terms of use.",
  alternates: { canonical: "/privacy" },
};

const linkClass = "text-teal-600 hover:text-teal-700 underline underline-offset-2";

export default async function PrivacyPolicyPage() {
  const contact = await getSiteContactConfig();
  const hasPhone = Boolean(contact.phone);
  const hasEmail = Boolean(contact.email);
  const phone = contact.phone || "our customer support number";
  const email = contact.email || "our support email";
  const address = contact.address || "our office";

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="August 2026">
      <div className="space-y-4">
        <p className="text-base text-slate-600 leading-relaxed">
          NainitalTaxi (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your
          privacy. This policy explains what information we collect when you use our website or
          book a taxi, tour, or rental with us, and how we use, store, and protect it.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          1. Information We Collect
        </h2>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>
            <strong className="text-ink font-medium">Contact information</strong>: name, phone
            number, email address, and (where relevant) your pickup address.
          </li>
          <li>
            <strong className="text-ink font-medium">Booking details</strong>: pickup and drop
            locations, travel dates, vehicle preference, number of passengers, and any special
            requests you share with us.
          </li>
          <li>
            <strong className="text-ink font-medium">Communications</strong>: messages you send
            us via our contact form, WhatsApp, phone, or email, including call recordings used
            for training and dispute resolution.
          </li>
          <li>
            <strong className="text-ink font-medium">Payment information</strong>: booking
            amounts and payment status. We do not store your card or UPI credentials &mdash;
            payments are processed through our third-party payment gateway, which handles that
            data under its own security standards.
          </li>
          <li>
            <strong className="text-ink font-medium">Usage data</strong>: standard technical
            data such as browser type, device, and pages visited, collected automatically to
            help us keep the site working correctly.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          2. How We Use Your Information
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">We use the information above to:</p>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>Confirm, manage, and fulfil your booking (including sharing trip details with the assigned driver);</li>
          <li>Contact you about your trip &mdash; confirmations, driver details, delays, or changes;</li>
          <li>Respond to enquiries and provide customer support;</li>
          <li>Improve our website, services, and pricing;</li>
          <li>Send occasional offers or updates, which you may opt out of at any time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          3. Sharing Your Information
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          We do not sell your personal information. We share it only with:
        </p>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>The driver and vehicle assigned to your trip, to the extent needed to complete the booking;</li>
          <li>Payment processors, to complete transactions;</li>
          <li>Authorities, where required by law or to protect the safety of passengers, drivers, or the public.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          4. Data Security
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          We take reasonable technical and organisational measures to protect your information
          against unauthorised access, loss, or misuse. However, no method of transmission over
          the internet is completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          5. Your Choices
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          You may ask us to correct inaccurate information or stop sending you promotional
          messages at any time by contacting us using the details below.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          6. Intellectual Property &amp; Website Terms of Use
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          All content on this website &mdash; including but not limited to text, itineraries,
          package descriptions, pricing tables, photographs, graphics, logos, and layout &mdash;
          is the property of NainitalTaxi and is protected by applicable copyright and
          intellectual property laws.
        </p>
        <p className="text-base text-slate-600 leading-relaxed">
          <strong className="text-ink font-medium">
            You may not, without our prior written permission:
          </strong>
        </p>
        <ul className="list-disc ml-6 space-y-2 text-base text-slate-600">
          <li>Copy, reproduce, republish, or scrape any text content from this website for use on another website, publication, or platform;</li>
          <li>Download, copy, or reuse any images, photographs, or graphics displayed on this website for any commercial or public purpose;</li>
          <li>Use automated tools (bots, scrapers, crawlers) to extract content, pricing, or data from this website;</li>
          <li>Present any part of this website&rsquo;s content as your own.</li>
        </ul>
        <p className="text-base text-slate-600 leading-relaxed">
          Unauthorised use of our content is a violation of our intellectual property rights and
          may result in legal action. If you would like to license or reference our content,
          please contact us first.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-display font-semibold text-ink">
          7. Contact Us
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          For any questions about this Privacy Policy or how your data is handled, contact us at:
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
          <li>
            <strong className="text-ink font-medium">Address</strong>: {address}
          </li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
