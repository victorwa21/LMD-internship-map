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
  internshipContactName: string; // Internship supervisor name
  internshipSiteEmail: string; // Internship supervisor email
  isRemote: boolean; // Whether the internship is remote
  internshipAddress?: InternshipAddress; // Optional if remote
  coordinates?: Coordinates; // Optional if remote
  startDate: string; // Internship start date (ISO format)
  endDate: string; // Internship end date (ISO format)
  // Required questions
  question1_whatMadeUnique: string; // What made this internship experience unique or different from what you expected?
  question2_meaningfulContribution: string; // What was the most meaningful project or contribution you made during your internship?
  question3_skillsLearned: string; // What skills or insights did you gain that you couldn't have learned in a traditional classroom?
  // Optional questions
  question4_mostSurprising?: string; // What was the most surprising or unexpected thing you discovered during this internship?
  question5_specificMoment?: string; // Describe a specific moment or project where you felt you made a real impact.
  question6_futureGoals?: string; // How has this internship influenced your future goals or career interests?
  travelTime?: TravelTime; // Optional if remote
  rating: number; // 1-5 stars (required)
  ratingComment: string; // Required comment about the rating
  photos?: string[]; // Array of base64-encoded image strings (optional)
  createdAt: string;
  updatedAt: string;
}

export type ProfileFormData = Omit<StudentProfile, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'> & {
  addressInput: string; // For Places autocomplete
};


