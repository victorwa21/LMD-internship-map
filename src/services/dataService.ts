import { StudentProfile } from '../types/profile';

const STORAGE_KEY = 'internship_map_profiles';

/**
 * Get all profiles from localStorage
 */
export function getAllProfiles(): StudentProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as StudentProfile[];
  } catch (error) {
    console.error('Error loading profiles from localStorage:', error);
    return [];
  }
}

/**
 * Get a profile by ID
 */
export function getProfileById(id: string): StudentProfile | null {
  try {
    const profiles = getAllProfiles();
    return profiles.find((profile) => profile.id === id) || null;
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    return null;
  }
}

/**
 * Save a profile to localStorage
 */
export function saveProfile(profile: StudentProfile): boolean {
  try {
    const profiles = getAllProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    
    if (existingIndex >= 0) {
      // Update existing profile
      profiles[existingIndex] = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new profile
      profiles.push(profile);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error('Error saving profile to localStorage:', error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
    return false;
  }
}

/**
 * Delete a profile from localStorage
 */
export function deleteProfile(id: string): boolean {
  try {
    const profiles = getAllProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting profile from localStorage:', error);
    return false;
  }
}

/**
 * Initialize localStorage with sample data if empty
 * Also updates existing sample profiles with travel times if they're missing
 */
export function initializeWithSampleData(sampleProfiles: StudentProfile[]): void {
  try {
    const existing = getAllProfiles();
    if (existing.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProfiles));
    } else {
      // Update existing profiles that match sample profiles and don't have travel times, ratings, or comments
      const updated = existing.map((profile) => {
        // Check if this is a sample profile (by ID pattern or company match)
        const isSampleProfile = profile.id.startsWith('sample_') || 
          sampleProfiles.some(s => s.internshipCompany === profile.internshipCompany);
        
        if (isSampleProfile) {
          // Find matching sample profile
          const sampleProfile = sampleProfiles.find(
            (sample) =>
              sample.id === profile.id ||
              (sample.internshipCompany === profile.internshipCompany &&
               Math.abs(sample.coordinates.lat - profile.coordinates.lat) < 0.01 &&
               Math.abs(sample.coordinates.lng - profile.coordinates.lng) < 0.01)
          );
          
          if (sampleProfile) {
            const updates: Partial<StudentProfile> = {};
            if (!profile.travelTime && sampleProfile.travelTime) {
              updates.travelTime = sampleProfile.travelTime;
            }
            if (!profile.rating && sampleProfile.rating) {
              updates.rating = sampleProfile.rating;
            }
            if (!profile.ratingComment && sampleProfile.ratingComment) {
              updates.ratingComment = sampleProfile.ratingComment;
            }
            if (Object.keys(updates).length > 0) {
              return { ...profile, ...updates };
            }
          }
        }
        return profile;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

/**
 * Clear all profiles from localStorage
 */
export function clearAllProfiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing profiles from localStorage:', error);
  }
}


