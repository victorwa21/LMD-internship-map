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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Basic Info (with Location), Required Questions, Optional Questions, Rating & Photos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]); // Array of base64 image strings

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      addressInput: '',
      field: '',
      internshipContactName: '',
      internshipSiteEmail: '',
      isRemote: false,
      startDate: '',
      endDate: '',
      travelTimeDriving: '',
      travelTimeWalking: '',
      travelTimeBus: '',
      question1_whatMadeUnique: '',
      question2_meaningfulContribution: '',
      question3_skillsLearned: '',
      question4_mostSurprising: '',
      question5_specificMoment: '',
      question6_futureGoals: '',
      rating: 0,
      ratingComment: '',
    },
  });

  // Watch isRemote to sync state
  const isRemote = watch('isRemote') || false;

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
      // Validate address if not remote
      if (!data.isRemote) {
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
      }

      // Parse travel times from form (only if not remote)
      const parseTravelTime = (value: string | undefined): number | undefined => {
        if (!value || value.trim() === '') return undefined;
        const parsed = parseInt(value.trim(), 10);
        return isNaN(parsed) ? undefined : parsed;
      };

      const travelTime = data.isRemote ? undefined : {
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
        isRemote: data.isRemote,
        internshipAddress: data.isRemote ? undefined : selectedAddress!.address,
        coordinates: data.isRemote ? undefined : selectedAddress!.coordinates,
        startDate: data.startDate,
        endDate: data.endDate,
        question1_whatMadeUnique: data.question1_whatMadeUnique.trim(),
        question2_meaningfulContribution: data.question2_meaningfulContribution.trim(),
        question3_skillsLearned: data.question3_skillsLearned.trim(),
        question4_mostSurprising: data.question4_mostSurprising?.trim() || undefined,
        question5_specificMoment: data.question5_specificMoment?.trim() || undefined,
        question6_futureGoals: data.question6_futureGoals?.trim() || undefined,
        travelTime,
        rating: data.rating,
        ratingComment: data.ratingComment.trim(),
      };

      const profileDataWithPhotos = {
        ...profileData,
        photos: photos.length > 0 ? photos : undefined,
      };

      const newProfile = createProfile(profileDataWithPhotos);

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

  const handleNext = async () => {
    // Validate current step before proceeding
    const fieldsToValidate: (keyof ProfileFormInput)[] = [];
    
    if (currentStep === 1) {
      // Step 1: Basic Info + Location (if not remote)
      fieldsToValidate.push('firstName', 'lastName', 'email', 'internshipCompany', 'field', 
        'internshipContactName', 'internshipSiteEmail', 'startDate', 'endDate');
      if (!isRemote) {
        fieldsToValidate.push('addressInput', 'travelTimeDriving', 'travelTimeBus');
      }
    } else if (currentStep === 2) {
      // Step 2: Required Questions
      fieldsToValidate.push('question1_whatMadeUnique', 'question2_meaningfulContribution', 'question3_skillsLearned');
    }
    // Step 4 (optional questions) and Step 5 (rating) don't need validation to proceed

    // Trigger validation for current step
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }

    // Proceed to next step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Required Questions';
      case 3: return 'Optional Questions';
      case 4: return 'Rating & Photos';
      default: return 'Add Your Profile';
    }
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle photo selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload JPEG, PNG, or WebP images.`);
        continue;
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Limit to 10 photos total
    const totalPhotos = photos.length + validFiles.length;
    if (totalPhotos > 10) {
      setError('Maximum 10 photos allowed. Please select fewer photos.');
      return;
    }

    try {
      // Convert files to base64
      const base64Promises = validFiles.map(convertFileToBase64);
      const base64Strings = await Promise.all(base64Promises);
      
      setPhotos((prev) => [...prev, ...base64Strings]);
      setError(null);
    } catch (err) {
      console.error('Error converting photos:', err);
      setError('Failed to process photos. Please try again.');
    }
  };

  // Remove a photo
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-20">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
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
          {/* Step Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => {
              const stepLabels = ['Basic Info', 'Required', 'Optional', 'Rating'];
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-yellow-400 text-black'
                          : isCompleted
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                    <span className={`ml-2 text-xs hidden sm:block ${
                      isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {stepLabels[step - 1]}
                    </span>
                  </div>
                  {step < 4 && (
                    <div className={`h-1 flex-1 mx-1 ${
                      isCompleted ? 'bg-yellow-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
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

          {/* Address with Nominatim Search - Only show if not remote */}
          {!isRemote && (
            <>
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.addressInput ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isSearching && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
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
            </>
          )}

          {/* Remote Checkbox */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isRemote')}
                onChange={(e) => {
                  setValue('isRemote', e.target.checked);
                  if (e.target.checked) {
                    // Clear address and travel times if remote
                    setSelectedAddress(null);
                    setAddressQuery('');
                    setValue('addressInput', '');
                    setValue('travelTimeDriving', '');
                    setValue('travelTimeWalking', '');
                    setValue('travelTimeBus', '');
                  }
                }}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                This is a remote internship
              </span>
            </label>
          </div>

          {/* Internship Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Internship Supervisor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="internshipContactName" className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="internshipContactName"
                type="text"
                {...register('internshipContactName')}
                placeholder="e.g., Erin Tobiasz"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  errors.internshipContactName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.internshipContactName && (
                <p className="mt-1 text-sm text-red-600">{errors.internshipContactName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="internshipSiteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor Email <span className="text-red-500">*</span>
              </label>
              <input
                id="internshipSiteEmail"
                type="email"
                {...register('internshipSiteEmail')}
                placeholder="e.g., supervisor@example.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  errors.internshipSiteEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.internshipSiteEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.internshipSiteEmail.message}</p>
              )}
            </div>
          </div>

            {/* Travel Times */}
            {!isRemote && (
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
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
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
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${
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
            )}
            </>
          )}

          {/* Step 2: Required Questions */}
          {currentStep === 2 && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Please answer these three required questions to help others understand your internship experience.
                </p>
              </div>

              <div>
                <label htmlFor="question1_whatMadeUnique" className="block text-sm font-medium text-gray-700 mb-1">
                  What made this internship experience unique or different from what you expected? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="question1_whatMadeUnique"
                  {...register('question1_whatMadeUnique')}
                  rows={4}
                  placeholder="Share what made this internship stand out..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    errors.question1_whatMadeUnique ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.question1_whatMadeUnique && (
                  <p className="mt-1 text-sm text-red-600">{errors.question1_whatMadeUnique.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="question2_meaningfulContribution" className="block text-sm font-medium text-gray-700 mb-1">
                  What was the most meaningful project or contribution you made during your internship? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="question2_meaningfulContribution"
                  {...register('question2_meaningfulContribution')}
                  rows={4}
                  placeholder="Describe a project or contribution you're proud of..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    errors.question2_meaningfulContribution ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.question2_meaningfulContribution && (
                  <p className="mt-1 text-sm text-red-600">{errors.question2_meaningfulContribution.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="question3_skillsLearned" className="block text-sm font-medium text-gray-700 mb-1">
                  What skills or insights did you gain that you couldn't have learned in a traditional classroom? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="question3_skillsLearned"
                  {...register('question3_skillsLearned')}
                  rows={4}
                  placeholder="Share the unique skills and insights you gained..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    errors.question3_skillsLearned ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.question3_skillsLearned && (
                  <p className="mt-1 text-sm text-red-600">{errors.question3_skillsLearned.message}</p>
                )}
              </div>
            </>
          )}

          {/* Step 3: Optional Questions */}
          {currentStep === 3 && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  These questions are optional, but they help tell a more complete story about your internship experience.
                </p>
              </div>

              <div>
                <label htmlFor="question4_mostSurprising" className="block text-sm font-medium text-gray-700 mb-1">
                  What was the most surprising or unexpected thing you discovered during this internship? <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="question4_mostSurprising"
                  {...register('question4_mostSurprising')}
                  rows={4}
                  placeholder="Share something that surprised you..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="question5_specificMoment" className="block text-sm font-medium text-gray-700 mb-1">
                  Describe a specific moment or project where you felt you made a real impact. <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="question5_specificMoment"
                  {...register('question5_specificMoment')}
                  rows={4}
                  placeholder="Tell us about a moment that mattered..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="question6_futureGoals" className="block text-sm font-medium text-gray-700 mb-1">
                  How has this internship influenced your future goals or career interests? <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="question6_futureGoals"
                  {...register('question6_futureGoals')}
                  rows={4}
                  placeholder="Share how this experience shaped your future plans..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </>
          )}

          {/* Step 4: Rating & Photos */}
          {currentStep === 4 && (
            <>
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.ratingComment ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.ratingComment && (
              <p className="mt-1 text-sm text-red-600">{errors.ratingComment.message}</p>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1">
              Photos <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Upload up to 10 photos from your internship experience (JPEG, PNG, or WebP, max 5MB each)
            </p>
            <input
              id="photos"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handlePhotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            />
            
            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <svg
                        className="w-4 h-4"
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
                ))}
              </div>
            )}
          </div>

            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors"
                  disabled={isSubmitting}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="px-6 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : success ? 'Success!' : 'Submit Profile'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
