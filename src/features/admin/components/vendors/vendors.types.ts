import type {
  AdminVendorDto,
  AdminTruckRequestDto,
} from "@/features/admin/types/admin.dto";
export type VendorItem = {
  id: string;
  name: string;
  isVerified?: boolean;
  status: string;
  source: AdminVendorDto;
  ownerName: string;
  email: string;
  phone: string;
  cuisine: string;
  serviceArea: string;
  rating: number;
  reviewsCount: number;
  followersCount: string;
  totalBookings: number;
  revenueGenerated: string;
  description: string;
  menuItems: string[];
  priceRange: string;
  memberSince: string;
  documents: LicenseDocument[];
};

export type TruckRequestItem = {
  id: string;
  reqCode: string;
  truckName: string;
  status: string;
  source: AdminTruckRequestDto;
  submittedDate: string;
  location: string;
  description: string;
  reason?: string;
  phone?: string;
  submitter: {
    name: string;
    email: string;
    role: string;
    avatarInitial: string;
  };
};

export type LicenseDocument = {
  id?: string;
  title: string;
  uploadedDate: string;
  status: string;
  url?: string;
  source?: Record<string, unknown>;
  licenseNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  businessName?: string;
  businessAddress?: string;
  ownerName?: string;
  businessType?: string;
};
