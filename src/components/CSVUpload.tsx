import { useState, useRef } from 'react';
import { StudentProfile } from '../types/profile';
import { createProfile } from '../utils/profileUtils';
import { geocodeAddress } from '../services/mapsService';
import { isPittsburghArea } from '../services/mapsService';
import { saveProfile } from '../services/dataService';

interface CSVUploadProps {
  onProfilesAdded: (profiles: StudentProfile[]) => void;
  onClose: () => void;
}

interface CSVRow {
  firstName: string;
  lastName: string;
  email: string;
  internshipCompany: string;
  field: string;
  internshipContactName: string;
  internshipSiteEmail: string;
  isRemote: string; // "yes", "no", "true", "false", "1", "0"
  startDate: string;
  endDate: string;
  address?: string;
  travelTimeDriving?: string;
  travelTimeWalking?: string;
  travelTimeBus?: string;
  // Required questions
  question1_whatmadeunique?: string;
  question2_meaningfulcontribution?: string;
  question3_skillslearned?: string;
  // Optional questions
  question4_mostsurprising?: string;
  question5_specificmoment?: string;
  question6_futuregoals?: string;
  // Legacy support
  accomplishments?: string;
  rating: string;
  ratingComment: string;
}

export default function CSVUpload({ onProfilesAdded, onClose }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // Add last field
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row as CSVRow);
    }

    return rows;
  };

  const parseBoolean = (value: string): boolean => {
    const lower = value.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1' || lower === 'y';
  };

  const parseTravelTime = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined;
    const parsed = parseInt(value.trim(), 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadedCount(0);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      const createdProfiles: StudentProfile[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        try {
          // Validate required fields
          if (!row.firstName || !row.lastName || !row.email || !row.internshipCompany || 
              !row.field || !row.internshipContactName || !row.internshipSiteEmail ||
              !row.startDate || !row.endDate || !row.rating || !row.ratingComment) {
            errors.push(`Row ${rowNumber}: Missing required fields`);
            continue;
          }

          // Check for required questions (new format) or accomplishments (legacy)
          const hasNewFormat = row.question1_whatmadeunique || row.question2_meaningfulcontribution || row.question3_skillslearned;
          const hasLegacyFormat = row.accomplishments;
          
          if (!hasNewFormat && !hasLegacyFormat) {
            errors.push(`Row ${rowNumber}: Missing required questions (question1_whatMadeUnique, question2_meaningfulContribution, question3_skillsLearned) or accomplishments`);
            continue;
          }

          // If legacy format, use accomplishments for all three required questions
          const question1 = row.question1_whatmadeunique?.trim() || row.accomplishments?.trim() || '';
          const question2 = row.question2_meaningfulcontribution?.trim() || row.accomplishments?.trim() || '';
          const question3 = row.question3_skillslearned?.trim() || row.accomplishments?.trim() || '';

          if (!question1 || !question2 || !question3) {
            errors.push(`Row ${rowNumber}: All three required questions must be provided`);
            continue;
          }

          const isRemote = parseBoolean(row.isRemote || 'no');
          const rating = parseInt(row.rating, 10);

          if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push(`Row ${rowNumber}: Rating must be between 1 and 5`);
            continue;
          }

          let address, coordinates;
          if (!isRemote) {
            if (!row.address) {
              errors.push(`Row ${rowNumber}: Address is required for non-remote internships`);
              continue;
            }

            try {
              coordinates = await geocodeAddress(row.address);
              // Create a basic address object
              address = {
                street: row.address.split(',')[0] || row.address,
                city: 'Pittsburgh',
                state: 'Pennsylvania',
                zip: '',
                fullAddress: row.address,
              };

              if (!isPittsburghArea(address)) {
                errors.push(`Row ${rowNumber}: Address must be in Pittsburgh area`);
                continue;
              }
            } catch (geoError) {
              errors.push(`Row ${rowNumber}: Could not geocode address: ${row.address}`);
              continue;
            }
          }

          const travelTime = isRemote ? undefined : {
            driving: parseTravelTime(row.travelTimeDriving),
            walking: parseTravelTime(row.travelTimeWalking),
            bus: parseTravelTime(row.travelTimeBus),
          };

          // Validate travel time for non-remote
          if (!isRemote && (!travelTime?.driving && !travelTime?.bus)) {
            errors.push(`Row ${rowNumber}: At least one travel time (driving or bus) is required for non-remote internships`);
            continue;
          }

          const profileData = {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: row.email.trim(),
            internshipCompany: row.internshipCompany.trim(),
            field: row.field.trim(),
            internshipContactName: row.internshipContactName.trim(),
            internshipSiteEmail: row.internshipSiteEmail.trim(),
            isRemote,
            internshipAddress: isRemote ? undefined : address,
            coordinates: isRemote ? undefined : coordinates,
            startDate: row.startDate.trim(),
            endDate: row.endDate.trim(),
            question1_whatMadeUnique: question1,
            question2_meaningfulContribution: question2,
            question3_skillsLearned: question3,
            question4_mostSurprising: row.question4_mostsurprising?.trim() || undefined,
            question5_specificMoment: row.question5_specificmoment?.trim() || undefined,
            question6_futureGoals: row.question6_futuregoals?.trim() || undefined,
            travelTime,
            rating,
            ratingComment: row.ratingComment.trim(),
          };

          const profile = createProfile(profileData);
          saveProfile(profile);
          createdProfiles.push(profile);
        } catch (rowError) {
          errors.push(`Row ${rowNumber}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        }
      }

      if (createdProfiles.length === 0) {
        throw new Error(`No profiles were created. Errors:\n${errors.join('\n')}`);
      }

      setUploadedCount(createdProfiles.length);
      setSuccess(true);
      onProfilesAdded(createdProfiles);

      if (errors.length > 0) {
        setError(`Successfully imported ${createdProfiles.length} profiles, but ${errors.length} rows had errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`);
      }
    } catch (err) {
      console.error('CSV upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20">
          <h2 className="text-2xl font-bold text-gray-900">Upload CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                <p className="font-semibold">Success!</p>
                <p className="text-sm">Successfully imported {uploadedCount} profile{uploadedCount !== 1 ? 's' : ''}.</p>
              </div>
              {error && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <p className="font-semibold">Note:</p>
                  <p className="text-sm whitespace-pre-wrap">{error}</p>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">CSV Format Requirements</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Your CSV file should have the following columns (case-insensitive):
                </p>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 space-y-1">
                  <div>firstName, lastName, email, internshipCompany, field,</div>
                  <div>internshipContactName, internshipSiteEmail, isRemote,</div>
                  <div>startDate (YYYY-MM-DD), endDate (YYYY-MM-DD),</div>
                  <div>address (required if not remote),</div>
                  <div>travelTimeDriving, travelTimeWalking, travelTimeBus (required if not remote),</div>
                  <div>question1_whatMadeUnique, question2_meaningfulContribution, question3_skillsLearned (required),</div>
                  <div>question4_mostSurprising, question5_specificMoment, question6_futureGoals (optional),</div>
                  <div>rating (1-5), ratingComment</div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm whitespace-pre-wrap">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
              </div>

              {isUploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing CSV file...</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

