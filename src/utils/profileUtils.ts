import { StudentProfile } from '../types/profile';

/**
 * Generate a unique ID for a new profile
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new profile with generated ID and timestamps
 */
export function createProfile(data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>): StudentProfile {
  const now = new Date().toISOString();
  return {
    ...data,
    id: generateProfileId(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate profile data
 */
export function validateProfile(profile: Partial<StudentProfile>): boolean {
  return !!(
    profile.firstName &&
    profile.lastName &&
    profile.email &&
    profile.internshipCompany &&
    profile.internshipAddress &&
    profile.coordinates &&
    profile.accomplishments
  );
}



