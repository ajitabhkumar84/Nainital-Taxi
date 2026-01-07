"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import VehicleForm from "@/components/admin/VehicleForm";
import { Vehicle } from "@/lib/supabase/types";

export default function EditVehiclePage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVehicle() {
      try {
        const response = await fetch(`/api/admin/vehicles?id=${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setVehicle(data);
        } else {
          setError("Vehicle not found");
        }
      } catch (err) {
        setError("Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchVehicle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/fleet"
            className="p-2 hover:bg-ink/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display text-ink">Edit Vehicle</h1>
        </div>

        <div className="bg-coral/10 border-3 border-coral rounded-xl p-6 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-coral" />
          <div>
            <h3 className="font-display text-lg text-coral">Error</h3>
            <p className="text-ink/70 font-body">{error || "Vehicle not found"}</p>
          </div>
        </div>

        <Link
          href="/admin/fleet"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sunrise hover:bg-sunshine rounded-xl border-3 border-ink font-body font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Fleet
        </Link>
      </div>
    );
  }

  return <VehicleForm vehicle={vehicle} isEditing />;
}
