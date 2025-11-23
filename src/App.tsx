import { useState, useEffect, useCallback } from 'react';
import Map from './components/Map';
import ProfileModal from './components/ProfileModal';
import AddProfileForm from './components/AddProfileForm';
import TravelTimeFilter from './components/TravelTimeFilter';
import FieldFilter from './components/FieldFilter';
import { StudentProfile } from './types/profile';
import { getAllProfiles, initializeWithSampleData, saveProfile, deleteProfile } from './services/dataService';
import { sampleProfiles } from './data/sampleData';

type FilterType = 'all' | 'driving' | 'walking' | 'bus';
type FilterTime = number; // in minutes

function App() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<StudentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterTime, setFilterTime] = useState<FilterTime>(30);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Load profiles on mount
  useEffect(() => {
    // Check if we need to migrate/update profiles
    const migrationKey = 'internship_map_travel_time_migrated';
    const ratingMigrationKey = 'internship_map_rating_migrated';
    const sampleDataMigrationKey = 'internship_map_sample_data_v2_migrated';
    const warholMigrationKey = 'internship_map_warhol_added';
    const needsMigration = !localStorage.getItem(migrationKey);
    const needsRatingMigration = !localStorage.getItem(ratingMigrationKey);
    const needsSampleDataMigration = !localStorage.getItem(sampleDataMigrationKey);
    const needsWarholMigration = !localStorage.getItem(warholMigrationKey);
    
    // Initialize with sample data if empty, or update existing sample profiles
    initializeWithSampleData(sampleProfiles);
    
    // Load all profiles
    let loadedProfiles = getAllProfiles();
    
    // Replace all old sample profiles with new ones (complete replacement)
    if (needsSampleDataMigration || needsWarholMigration) {
      // Remove all old sample profiles (those with sample_ IDs)
      const userProfiles = loadedProfiles.filter(p => !p.id.startsWith('sample_'));
      // Add new sample profiles
      const allProfiles = [...userProfiles, ...sampleProfiles];
      // Save back to localStorage
      localStorage.setItem('internship_map_profiles', JSON.stringify(allProfiles));
      loadedProfiles = allProfiles;
      localStorage.setItem(sampleDataMigrationKey, 'true');
      localStorage.setItem(warholMigrationKey, 'true');
    }
    
    // Ensure Andy Warhol Museum profile exists
    const hasWarhol = loadedProfiles.some(p => 
      p.internshipCompany === 'Andy Warhol Museum' || p.id === 'sample_9'
    );
    if (!hasWarhol) {
      const warholProfile = sampleProfiles.find(p => p.id === 'sample_9');
      if (warholProfile) {
        loadedProfiles.push(warholProfile);
        saveProfile(warholProfile);
      }
    }
    
    // Force update all sample profiles with travel times on first load after update
    if (needsMigration || loadedProfiles.some(p => !p.travelTime || (p.travelTime.driving === 0 && p.travelTime.walking === 0 && p.travelTime.bus === 0))) {
      const updatedProfiles = loadedProfiles.map((profile) => {
        // Try to find matching sample profile
        let sampleMatch = sampleProfiles.find(s => s.id === profile.id);
        if (!sampleMatch) {
          // Try matching by company name and coordinates
          sampleMatch = sampleProfiles.find(s => 
            s.internshipCompany === profile.internshipCompany &&
            Math.abs(s.coordinates.lat - profile.coordinates.lat) < 0.01 &&
            Math.abs(s.coordinates.lng - profile.coordinates.lng) < 0.01
          );
        }
        
        if (sampleMatch?.travelTime) {
          const updated = { ...profile, travelTime: sampleMatch.travelTime };
          saveProfile(updated);
          return updated;
        }
        return profile;
      });
      
      loadedProfiles = updatedProfiles;
      localStorage.setItem(migrationKey, 'true');
    }
    
    // Force update all sample profiles with ratings and comments
    if (needsRatingMigration || loadedProfiles.some(p => !p.rating || !p.ratingComment)) {
      const updatedProfiles = loadedProfiles.map((profile) => {
        // Try to find matching sample profile
        let sampleMatch = sampleProfiles.find(s => s.id === profile.id);
        if (!sampleMatch) {
          // Try matching by company name and coordinates
          sampleMatch = sampleProfiles.find(s => 
            s.internshipCompany === profile.internshipCompany &&
            Math.abs(s.coordinates.lat - profile.coordinates.lat) < 0.01 &&
            Math.abs(s.coordinates.lng - profile.coordinates.lng) < 0.01
          );
        }
        
        if (sampleMatch && (!profile.rating || !profile.ratingComment)) {
          const updated = { 
            ...profile, 
            rating: sampleMatch.rating,
            ratingComment: sampleMatch.ratingComment
          };
          saveProfile(updated);
          return updated;
        }
        return profile;
      });
      
      loadedProfiles = updatedProfiles;
      localStorage.setItem(ratingMigrationKey, 'true');
    }
    
    // Filter out test profiles with "asdf" in the name and remove from localStorage
    const cleanedProfiles = loadedProfiles.filter((profile) => {
      const hasAsdf = profile.firstName.toLowerCase().includes('asdf') || 
                      profile.lastName.toLowerCase().includes('asdf');
      if (hasAsdf) {
        // Remove from localStorage
        deleteProfile(profile.id);
      }
      return !hasAsdf;
    });
    
    setProfiles(cleanedProfiles);
    setFilteredProfiles(cleanedProfiles);
    setIsLoading(false);
  }, []);

  const handleMarkerClick = useCallback((profile: StudentProfile) => {
    setSelectedProfile(profile);
  }, []);

  const handleProfileAdded = useCallback((newProfile: StudentProfile) => {
    // Add to profiles state - the useEffect will handle filtering automatically
    setProfiles((prev) => [...prev, newProfile]);
    setShowAddForm(false);
  }, []);

  // Filter profiles based on travel time and fields
  useEffect(() => {
    let filtered = profiles;

    // Filter by travel time
    if (filterType !== 'all') {
      filtered = filtered.filter((profile) => {
        if (!profile.travelTime) return false;
        
        const timeInMinutes = filterType === 'driving' 
          ? profile.travelTime.driving
          : filterType === 'walking'
          ? profile.travelTime.walking
          : profile.travelTime.bus;
        
        return timeInMinutes !== undefined && timeInMinutes > 0 && timeInMinutes <= filterTime;
      });
    }

    // Filter by fields
    if (selectedFields.length > 0) {
      filtered = filtered.filter((profile) => 
        selectedFields.includes(profile.field)
      );
    }

    setFilteredProfiles(filtered);
  }, [profiles, filterType, filterTime, selectedFields]);


  const handleCloseModal = useCallback(() => {
    setSelectedProfile(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">COBHS Internship Map</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors shadow-md text-sm md:text-base w-full md:w-auto"
          >
            + Add Your Profile
          </button>
        </div>
      </header>

      {/* Map Container */}
      <main className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            <Map profiles={filteredProfiles} onMarkerClick={handleMarkerClick} />
            <FieldFilter
              selectedFields={selectedFields}
              onFieldsChange={setSelectedFields}
            />
            <TravelTimeFilter
              filterType={filterType}
              filterTime={filterTime}
              onFilterTypeChange={setFilterType}
              onFilterTimeChange={setFilterTime}
            />
          </>
        )}

        {/* Empty State */}
        {!isLoading && profiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <p className="text-xl text-gray-600 mb-4">No profiles yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                Add the First Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedProfile && (
        <ProfileModal profile={selectedProfile} onClose={handleCloseModal} />
      )}
      {showAddForm && (
        <AddProfileForm
          onClose={() => setShowAddForm(false)}
          onProfileAdded={handleProfileAdded}
        />
      )}
    </div>
  );
}

export default App;
