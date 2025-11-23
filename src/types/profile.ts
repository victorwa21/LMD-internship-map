export interface InternshipAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TravelTime {
  driving?: number; // in minutes
  walking?: number; // in minutes
  bus?: number; // in minutes
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  internshipCompany: string;
  field: string; // Internship field/type
  internshipContactName: string; // Contact person name
  internshipSiteEmail: string; // Contact email
  internshipAddress: InternshipAddress;
  coordinates: Coordinates;
  accomplishments: string;
  travelTime?: TravelTime;
  rating: number; // 1-5 stars (required)
  ratingComment: string; // Required comment about the rating
  createdAt: string;
  updatedAt: string;
}

export type ProfileFormData = Omit<StudentProfile, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'> & {
  addressInput: string; // For Places autocomplete
};


