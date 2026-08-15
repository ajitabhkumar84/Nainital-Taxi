import { Header } from "@/components/ui";
// Direct path, not the ui barrel — see the note in FooterServer.tsx (async
// server component; pulling it through the client-facing barrel would break
// the build).
import FooterServer from "@/components/ui/FooterServer";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for the static legal pages (/privacy, /terms,
 * /cancellation-policy) — Header, a title hero, and FooterServer. Each page
 * owns its own copy and passes it in as children; this component only owns
 * the layout, not the content.
 */
export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <>
      <Header />

      <div className="bg-lake border-b border-slate-200">
        <div className="container mx-auto max-w-[1200px] px-4 py-16 md:py-20">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink mb-2">
            {title}
          </h1>
          <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-[800px] px-4 py-12 md:py-16">
        <div className="space-y-10">{children}</div>
      </div>

      <FooterServer />
    </>
  );
}
