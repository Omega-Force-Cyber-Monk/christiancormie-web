import type {
  AdminVendorDto,
  AdminTruckRequestDto,
} from "@/features/admin/types/admin.dto";
import { z } from "zod";
import { documentKey } from "@/features/admin/api/adminVendorOperations.api";
import type {
  VendorItem,
  TruckRequestItem,
  LicenseDocument,
} from "@/features/admin/components/vendors/vendors.types";
import {
  formatDate,
  formatNumber,
  formatCurrency,
  getInitials,
} from "@/features/admin/utils/adminFormat";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;
export function documentUrl(url: unknown) {
  if (typeof url !== "string") return undefined;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
function toDocument(value: unknown, vendor: AdminVendorDto): LicenseDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const doc = value as Record<string, unknown>;
  const title = text(doc.title) ?? text(doc.name) ?? text(doc.type);
  if (!title) return null;
  const request = vendor.verificationRequests?.[0];
  const key = documentKey(doc, request?.documents);
  return {
    ...(key &&
    z.uuid().safeParse(request?.id).success &&
    z.uuid().safeParse(vendor.id).success
      ? {
          verification: {
            vendorId: vendor.id,
            requestId: request.id,
            documentKey: key,
          },
        }
      : {}),
    source: doc,
    id: text(doc.id) ?? text(doc.type),
    title: title.replaceAll("_", " "),
    url: documentUrl(doc.url),
    uploadedDate: formatDate(
      text(doc.uploadedAt) ?? vendor.verificationRequests?.[0]?.createdAt,
    ),
    status: text(doc.status) ?? "N/A",
    licenseNumber: text(doc.licenseNumber),
    issueDate: text(doc.issueDate),
    expirationDate: text(doc.expirationDate),
    businessName: vendor.businessName,
    ownerName: vendor.ownerName,
    businessAddress: text(doc.businessAddress),
    businessType: text(doc.businessType),
  };
}
export function toAdminVendor(vendor: AdminVendorDto): VendorItem {
  const documents = Array.isArray(vendor.documents) ? vendor.documents : [];
  return {
    source: vendor,
    id: vendor.id,
    name: vendor.businessName,
    isVerified: vendor.isVerified,
    status:
      vendor.status === "APPROVED"
        ? "active"
        : vendor.status.toLowerCase().replaceAll("_", " "),
    ownerName: vendor.ownerName,
    email: vendor.email ?? "N/A",
    phone: vendor.phone ?? "N/A",
    cuisine: vendor.cuisine ?? "N/A",
    serviceArea: vendor.serviceArea ?? "N/A",
    rating: vendor.rating,
    reviewsCount: vendor.reviews,
    followersCount: formatNumber(vendor.followers),
    totalBookings: vendor.totalBookings,
    revenueGenerated: formatCurrency(vendor.revenueGenerated),
    description: vendor.description ?? "N/A",
    menuItems: vendor.menuItems ?? [],
    priceRange: vendor.priceRange ?? "N/A",
    memberSince: formatDate(vendor.memberSince),
    documents: documents
      .map((doc) => toDocument(doc, vendor))
      .filter((doc): doc is LicenseDocument => doc !== null),
  };
}
export function toAdminTruckRequest(request: AdminTruckRequestDto): TruckRequestItem {
  const profile = request.requestedBy?.profile;
  const name =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    request.requestedBy?.email ||
    "N/A";
  return {
    source: request,
    id: request.id,
    reqCode: request.id,
    truckName: request.truckName,
    status:
      request.status === "PENDING"
        ? "Pending"
        : request.status === "COMMUNICATED"
          ? "Communicated"
          : request.status.toLowerCase(),
    submittedDate: formatDate(request.createdAt),
    location: [request.city, request.state].filter(Boolean).join(", ") || "N/A",
    description: request.notes ?? "N/A",
    reason: request.notes ?? undefined,
    phone: request.ownerPhone ?? undefined,
    submitter: {
      name,
      email: request.requestedBy?.email ?? "N/A",
      role: "Requester",
      avatarInitial: getInitials(name),
    },
  };
}
