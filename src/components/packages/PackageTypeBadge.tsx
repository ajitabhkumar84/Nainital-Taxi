import { Car, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageTypeBadgeProps {
  hasHotel: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function PackageTypeBadge({ hasHotel, size = "sm", className }: PackageTypeBadgeProps) {
  const sizeClasses = size === "sm" ? "px-3 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-body font-bold border-2 border-ink",
        sizeClasses,
        hasHotel ? "bg-teal text-white" : "bg-lake text-ink",
        className
      )}
    >
      {hasHotel ? <Hotel className="w-3 h-3" /> : <Car className="w-3 h-3" />}
      {hasHotel ? "Taxi + Hotel" : "Taxi Only"}
    </span>
  );
}
