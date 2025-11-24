import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, ProfileFormInput, INTERNSHIP_FIELDS } from '../utils/validation';
import { searchAddresses, isPittsburghArea } from '../services/mapsService';
import { createProfile } from '../utils/profileUtils';
// import { saveProfile } from '../services/dataService'; // Commented out - profiles are temporary for now
import { StudentProfile, InternshipAddress } from '../types/profile';

interface AddProfileFormProps {
  onClose: () => void;
  onProfileAdded: (profile: StudentProfile) => void;
}

interface AddressOption {
  display: string;
  address: InternshipAddress;
  coordinates: { lat: number; lng: number };
}

export default function AddProfileForm({ onClose, onProfileAdded }: AddProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [rating, setRating] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      addressInput: '',
      field: '',
      internshipContactName: '',
      internshipSiteEmail: '',
      travelTimeDriving: '',
      travelTimeWalking: '',
      travelTimeBus: '',
      rating: 0,
      ratingComment: '',
    },
  });

  // Debounced address search
  useEffect(() => {
    if (addressQuery.length < 3) {
      setAddressOptions([]);
      setShowAddressDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAddresses(addressQuery);
        setAddressOptions(results);
        setShowAddressDropdown(results.length > 0);
      } catch (err) {
        console.error('Error searching addresses:', err);
        setAddressOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [addressQuery]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleAddressSelect = (option: AddressOption) => {
    setSelectedAddress(option);
    setAddressQuery(option.display);
    setValue('addressInput', option.display);
    setShowAddressDropdown(false);
  };

  const onSubmit = async (data: ProfileFormInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate address is selected
      if (!selectedAddress) {
        setError('Please select an address from the search results.');
        setIsSubmitting(false);
        return;
      }

      // Validate address is in Pittsburgh area
      if (!isPittsburghArea(selectedAddress.address)) {
        setError('Please select an address in the Pittsburgh area.');
        setIsSubmitting(false);
        return;
      }

      // Parse travel times from form
      // Validation ensures at least one of driving or bus is provided
      const parseTravelTime = (value: string | undefined): number | undefined => {
        if (!value || value.trim() === '') return undefined;
        const parsed = parseInt(value.trim(), 10);
        return isNaN(parsed) ? undefined : parsed;
      };

      const travelTime = {
        driving: parseTravelTime(data.travelTimeDriving),
        walking: parseTravelTime(data.travelTimeWalking),
        bus: parseTravelTime(data.travelTimeBus),
      };

      // Create profile
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        internshipCompany: data.internshipCompany,
        field: data.field,
        internshipContactName: data.internshipContactName,
        internshipSiteEmail: data.internshipSiteEmail,
        internshipAddress: selectedAddress.address,
        coordinates: selectedAddress.coordinates,
        accomplishments: data.accomplishments,
        travelTime,
        rating: data.rating,
        ratingComment: data.ratingComment.trim(),
      };

      const newProfile = createProfile(profileData);

      // Debug: Log the travel time to verify it's being set correctly
      console.log('New profile travel time:', newProfile.travelTime);

      // Don't save to localStorage - keep it temporary (will disappear on refresh)
      // TODO: Later, uncomment this to make profiles permanent:
      // const saved = saveProfile(newProfile);
      // if (!saved) {
      //   throw new Error('Failed to save profile');
      // }

      setSuccess(true);
      onProfileAdded(newProfile);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit profile. Please try again.');
      setIsSubmitting(false);
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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close form"
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

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              <p className="font-semibold">Profile added successfully!</p>
              <p className="text-sm">Closing form...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="internshipCompany" className="block text-sm font-medium text-gray-700 mb-1">
              Internship Company/Organization <span className="text-red-500">*</span>
            </label>
            <input
              id="internshipCompany"
              type="text"
              {...register('internshipCompany')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.internshipCompany ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.internshipCompany && (
              <p className="mt-1 text-sm text-red-600">{errors.internshipCompany.message}</p>
            )}
          </div>

          {/* Field Dropdown */}
          <div>
            <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
              Internship Field <span className="text-red-500">*</span>
            </label>
            <select
              id="field"
              {...register('field')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.field ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a field...</option>
              {INTERNSHIP_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
            {errors.field && (
              <p className="mt-1 text-sm text-red-600">{errors.field.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="internshipContactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="internshipContactName"
                type="text"
                {...register('internshipContactName')}
                placeholder="e.g., Erin Tobiasz"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.internshipContactName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.internshipContactName && (
                <p className="mt-1 text-sm text-red-600">{errors.internshipContactName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="internshipSiteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                id="internshipSiteEmail"
                type="email"
                {...register('internshipSiteEmail')}
                placeholder="e.g., contact@example.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.internshipSiteEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.internshipSiteEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.internshipSiteEmail.message}</p>
              )}
            </div>
          </div>

          {/* Address with Nominatim Search */}
          <div className="relative">
            <label htmlFor="addressInput" className="block text-sm font-medium text-gray-700 mb-1">
              Internship Address <span className="text-red-500">*</span>
            </label>
            <input
              id="addressInput"
              type="text"
              {...register('addressInput')}
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                setValue('addressInput', e.target.value);
                setSelectedAddress(null);
              }}
              onFocus={() => {
                if (addressOptions.length > 0) {
                  setShowAddressDropdown(true);
                }
              }}
              placeholder="Start typing an address in Pittsburgh..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.addressInput ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isSearching && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
            {errors.addressInput && (
              <p className="mt-1 text-sm text-red-600">{errors.addressInput.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Type at least 3 characters to search for addresses
            </p>
            
            {/* Address Dropdown */}
            {showAddressDropdown && addressOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {addressOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAddressSelect(option)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200 last:border-b-0"
                  >
                    <div className="text-sm text-gray-900">{option.display}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Travel Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Time from School
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Enter the travel time in minutes from City of Bridges High School (460 S Graham St). 
              <span className="text-red-500"> At least one of Car or Bus is required.</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="travelTimeDriving" className="block text-xs font-medium text-gray-600 mb-1">
                  🚗 By Car (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  id="travelTimeDriving"
                  type="number"
                  min="0"
                  {...register('travelTimeDriving')}
                  placeholder="e.g., 15"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.travelTimeDriving ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.travelTimeDriving && (
                  <p className="mt-1 text-xs text-red-600">{errors.travelTimeDriving.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="travelTimeWalking" className="block text-xs font-medium text-gray-600 mb-1">
                  🚶 Walking (minutes) <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  id="travelTimeWalking"
                  type="number"
                  min="0"
                  {...register('travelTimeWalking')}
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="travelTimeBus" className="block text-xs font-medium text-gray-600 mb-1">
                  🚌 By Bus (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  id="travelTimeBus"
                  type="number"
                  min="0"
                  {...register('travelTimeBus')}
                  placeholder="e.g., 25"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errors.travelTimeBus ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.travelTimeBus && (
                  <p className="mt-1 text-xs text-red-600">{errors.travelTimeBus.message}</p>
                )}
              </div>
            </div>
            {/* Show error message if neither car nor bus is provided */}
            {errors.travelTimeDriving && errors.travelTimeDriving.type === 'custom' && (
              <p className="mt-2 text-sm text-red-600">{errors.travelTimeDriving.message}</p>
            )}
          </div>

          {/* Accomplishments */}
          <div>
            <label htmlFor="accomplishments" className="block text-sm font-medium text-gray-700 mb-1">
              Accomplishments, Learnings & Achievements <span className="text-red-500">*</span>
            </label>
            <textarea
              id="accomplishments"
              {...register('accomplishments')}
              rows={6}
              placeholder="Describe what you learned, accomplished, or achieved during your internship..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.accomplishments ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accomplishments && (
              <p className="mt-1 text-sm text-red-600">{errors.accomplishments.message}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Your Internship Experience <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    setValue('rating', star);
                  }}
                  className="text-3xl focus:outline-none transition-transform hover:scale-110"
                >
                  {star <= rating ? '⭐' : '☆'}
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
              )}
            </div>
            <input
              type="hidden"
              {...register('rating', { valueAsNumber: true })}
              value={rating}
            />
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* Rating Comment */}
          <div>
            <label htmlFor="ratingComment" className="block text-sm font-medium text-gray-700 mb-1">
              Share Your Thoughts About This Internship <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ratingComment"
              {...register('ratingComment')}
              rows={4}
              placeholder="Why did you rate it this way? What did you like or not like about the internship experience?"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ratingComment ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.ratingComment && (
              <p className="mt-1 text-sm text-red-600">{errors.ratingComment.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : success ? 'Success!' : 'Add Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
