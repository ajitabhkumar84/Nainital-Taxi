"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { DetailedInclusionExclusion } from "@/lib/supabase/types";

interface DetailedInclusionsExclusionsProps {
  includes?: DetailedInclusionExclusion[];
  excludes?: DetailedInclusionExclusion[];
}

export default function DetailedInclusionsExclusions({
  includes,
  excludes,
}: DetailedInclusionsExclusionsProps) {
  if ((!includes || includes.length === 0) && (!excludes || excludes.length === 0)) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            What&apos;s <span className="text-whatsapp">Included</span> &{" "}
            <span className="text-coral">Excluded</span>
          </h2>
          <p className="text-ink/60 font-body">
            Complete transparency - know exactly what you&apos;re paying for
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* What's INCLUDED */}
          {includes && includes.length > 0 && (
            <div className="bg-gradient-to-br from-whatsapp/10 to-white rounded-2xl shadow-xl p-6 md:p-8 border-3 border-whatsapp/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-whatsapp rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-7 h-7 text-white stroke-[3]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-display text-ink">What&apos;s Included</h3>
              </div>

              <ul className="space-y-4">
                {includes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-6 h-6 bg-whatsapp/20 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-whatsapp" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-body font-semibold text-ink text-base">
                        {item.item}
                      </div>
                      {item.description && (
                        <div className="text-sm text-ink/60 font-body mt-1">
                          {item.description}
                        </div>
                      )}
                      {item.category && (
                        <div className="text-xs text-whatsapp bg-whatsapp/10 px-2 py-1 rounded inline-block mt-1">
                          {item.category}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What's EXCLUDED */}
          {excludes && excludes.length > 0 && (
            <div className="bg-gradient-to-br from-coral/10 to-white rounded-2xl shadow-xl p-6 md:p-8 border-3 border-coral/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center shadow-lg">
                  <X className="w-7 h-7 text-white stroke-[3]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-display text-ink">What&apos;s NOT Included</h3>
              </div>

              <ul className="space-y-4">
                {excludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-6 h-6 bg-coral/20 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-coral" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-body font-semibold text-ink text-base">
                        {item.item}
                      </div>
                      {item.description && (
                        <div className="text-sm text-ink/60 font-body mt-1">
                          {item.description}
                        </div>
                      )}
                      {item.category && (
                        <div className="text-xs text-coral bg-coral/10 px-2 py-1 rounded inline-block mt-1">
                          {item.category}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
