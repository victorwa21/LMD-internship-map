import { z } from 'zod';

// Internship fields sorted alphabetically (case-insensitive)
export const INTERNSHIP_FIELDS = [
  'activism & food justice',
  'animal rescue',
  'art',
  'ceramics',
  'chess non-profit',
  'child care',
  'climbing',
  'clothing: corporate office',
  'coding',
  'comedy, comic illustration',
  'construction/social service',
  'consulting',
  'corporate law',
  'dance movement therapy',
  'election work',
  'falconry',
  'film/video editing',
  'food/community',
  'global service',
  'hair',
  'K-8 Education',
  'library science',
  'medicine',
  'mortician',
  'needlework',
  'physical therapy',
  'podcasting',
  'public service',
  'restaurant',
  'retail-skateboarding',
  'robotics',
  'romance writing & publication',
  'scientific illustration',
  'tattooing',
  'tea & small business management',
  'teaching & craft work',
  'technology',
  'therapy',
  'urban renewal',
  'veterinary science',
  'welding',
  'writing',
  'youth empowerment',
] as const;

export const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  internshipCompany: z.string().min(1, 'Company name is required'),
  field: z.string().min(1, 'Please select an internship field'),
  internshipContactName: z.string().min(1, 'Supervisor name is required'),
  internshipSiteEmail: z.string().email('Invalid supervisor email address'),
  isRemote: z.boolean(),
  addressInput: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  // Required questions
  question1_whatMadeUnique: z.string().min(10, 'Please provide at least 10 characters'),
  question2_meaningfulContribution: z.string().min(10, 'Please provide at least 10 characters'),
  question3_skillsLearned: z.string().min(10, 'Please provide at least 10 characters'),
  // Optional questions
  question4_mostSurprising: z.string().optional().or(z.literal('')),
  question5_specificMoment: z.string().optional().or(z.literal('')),
  question6_futureGoals: z.string().optional().or(z.literal('')),
  travelTimeDriving: z.string().optional().or(z.literal('')),
  travelTimeWalking: z.string().optional().or(z.literal('')),
  travelTimeBus: z.string().optional().or(z.literal('')),
  rating: z.number().min(1, 'Please provide a rating').max(5),
  ratingComment: z.string().min(1, 'Please provide a comment about your rating'),
}).refine(
  (data) => {
    // If not remote, address is required
    if (!data.isRemote && (!data.addressInput || data.addressInput.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Address is required for in-person internships',
    path: ['addressInput'],
  }
).refine(
  (data) => {
    // If not remote, at least one of driving or bus must be provided
    if (!data.isRemote) {
      const hasDriving = data.travelTimeDriving && data.travelTimeDriving.trim() !== '';
      const hasBus = data.travelTimeBus && data.travelTimeBus.trim() !== '';
      return hasDriving || hasBus;
    }
    return true;
  },
  {
    message: 'Please provide at least one travel time (Car or Bus) for in-person internships',
    path: ['travelTimeDriving'],
  }
).refine(
  (data) => {
    // End date should be after start date
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
);

export type ProfileFormInput = z.infer<typeof profileFormSchema>;


