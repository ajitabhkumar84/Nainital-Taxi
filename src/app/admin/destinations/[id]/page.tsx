"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import DestinationForm from "@/components/admin/DestinationForm";
import { Destination } from "@/lib/supabase/types";

export default function EditDestinationPage() {
  const params = useParams();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDestination() {
      try {
        const response = await fetch(`/api/admin/destinations?id=${params.id}`);
        if (!response.ok) {
          throw new Error("Destination not found");
        }
        const data = await response.json();
        setDestination(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load destination");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchDestination();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-xl font-display text-ink mb-2">Destination not found</div>
          <p className="text-ink/60 font-body">{error}</p>
        </div>
      </div>
    );
  }

  return <DestinationForm destination={destination} isEditing />;
}
