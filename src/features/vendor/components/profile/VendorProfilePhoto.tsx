import { useEffect, useRef } from "react";
import type { ProfilePhotoSource } from "@/features/vendor/data/profile.data";
export function VendorProfilePhoto({
  source,
  alt,
  className = "",
}: {
  source?: ProfilePhotoSource;
  alt: string;
  className?: string;
}) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!source || typeof source === "string" || !image.current) return;
    const url = URL.createObjectURL(source);
    image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [source]);
  return source ? (
    <img
      ref={image}
      src={typeof source === "string" ? source : undefined}
      alt={alt}
      className={className}
    />
  ) : null;
}
