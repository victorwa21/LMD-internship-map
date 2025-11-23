import { z } from 'zod';

export const INTERNSHIP_FIELDS = [
  'library science',
  'physical therapy',
  'medicine',
  'podcasting',
  'welding',
  'teaching & craft work',
  'dance movement therapy',
  'hair',
  'activism & food justice',
  'coding',
  'tattooing',
  'scientific illustration',
  'public service',
  'needlework',
  'child care',
  'ceramics',
  'climbing',
  'tea & small business management',
  'romance writing & publication',
  'animal rescue',
  'robotics',
  'writing',
  'election work',
  'film/video editing',
  'comedy, comic illustration',
  'art',
  'veterinary science',
  'technology',
  'falconry',
  'youth empowerment',
  'K-8 Education',
  'retail-skateboarding',
  'mortician',
  'construction/social service',
  'corporate law',
  'therapy',
  'urban renewal',
  'consulting',
  'chess non-profit',
  'food/community',
  'clothing: corporate office',
  'restaurant',
  'global service',
] as const;

export const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  internshipCompany: z.string().min(1, 'Company name is required'),
  field: z.string().min(1, 'Please select an internship field'),
  internshipContactName: z.string().min(1, 'Contact name is required'),
  internshipSiteEmail: z.string().email('Invalid contact email address'),
  addressInput: z.string().min(1, 'Address is required'),
  accomplishments: z.string().min(10, 'Please provide at least 10 characters describing your accomplishments'),
  travelTimeDriving: z.string().optional().or(z.literal('')),
  travelTimeWalking: z.string().optional().or(z.literal('')),
  travelTimeBus: z.string().optional().or(z.literal('')),
  rating: z.number().min(1, 'Please provide a rating').max(5),
  ratingComment: z.string().min(1, 'Please provide a comment about your rating'),
}).refine(
  (data) => {
    // At least one of driving or bus must be provided
    const hasDriving = data.travelTimeDriving && data.travelTimeDriving.trim() !== '';
    const hasBus = data.travelTimeBus && data.travelTimeBus.trim() !== '';
    return hasDriving || hasBus;
  },
  {
    message: 'Please provide at least one travel time (Car or Bus)',
    path: ['travelTimeDriving'], // This will show the error on the driving field
  }
);

export type ProfileFormInput = z.infer<typeof profileFormSchema>;


