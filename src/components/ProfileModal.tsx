import { useEffect, useState } from 'react';
import { StudentProfile } from '../types/profile';

interface ProfileModalProps {
  profile: StudentProfile | null;
  onClose: () => void;
}

export default function ProfileModal({ profile, onClose }: ProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (profile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [profile]);

  useEffect(() => {
    // Reset photo index when profile changes
    setCurrentPhotoIndex(0);
  }, [profile?.id]);

  const handlePreviousPhoto = () => {
    if (!profile?.photos) return;
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? profile.photos!.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    if (!profile?.photos) return;
    setCurrentPhotoIndex((prev) => 
      prev === profile.photos!.length - 1 ? 0 : prev + 1
    );
  };

  const handlePhotoClick = () => {
    setIsFullscreen(true);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (profile) {
          onClose();
        }
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!isFullscreen || !profile?.photos) return;
      if (e.key === 'ArrowLeft') {
        setCurrentPhotoIndex((prev) => 
          prev === 0 ? profile.photos!.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIndex((prev) => 
          prev === profile.photos!.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleArrowKeys);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleArrowKeys);
    };
  }, [profile, onClose, isFullscreen]);

  if (!profile) return null;

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
          <h2 className="text-2xl font-bold text-gray-900">
            {profile.firstName} {profile.lastName}
          </h2>
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

        <div className="px-6 py-6 space-y-6">
          {/* Internship Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Internship Company
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-lg text-gray-900">{profile.internshipCompany}</p>
              {profile.isRemote && (
                <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                  Remote
                </span>
              )}
            </div>
          </div>

          {/* Field */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Field
            </h3>
            <p className="text-gray-900 capitalize">{profile.field}</p>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Internship Period
            </h3>
            <p className="text-gray-900">
              {new Date(profile.startDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - {new Date(profile.endDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Internship Supervisor */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Internship Supervisor
            </h3>
            <p className="text-gray-900">{profile.internshipContactName}</p>
            <a
              href={`mailto:${profile.internshipSiteEmail}`}
              className="text-yellow-600 hover:text-yellow-700 underline text-sm"
            >
              {profile.internshipSiteEmail}
            </a>
          </div>

          {/* Address */}
          {!profile.isRemote && profile.internshipAddress && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Address
              </h3>
              <p className="text-gray-900">{profile.internshipAddress.fullAddress}</p>
            </div>
          )}

          {/* Travel Time */}
          {!profile.isRemote && profile.travelTime && ((profile.travelTime.driving !== undefined && profile.travelTime.driving > 0) || (profile.travelTime.walking !== undefined && profile.travelTime.walking > 0) || (profile.travelTime.bus !== undefined && profile.travelTime.bus > 0)) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Travel Time from School
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {profile.travelTime.driving !== undefined && profile.travelTime.driving > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-2xl mr-2">🚗</span>
                    <div>
                      <p className="text-xs text-gray-500">Car</p>
                      <p className="text-lg font-semibold text-yellow-600">
                        {profile.travelTime.driving} min
                      </p>
                    </div>
                  </div>
                )}
                {profile.travelTime.walking !== undefined && profile.travelTime.walking > 0 && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-2xl mr-2">🚶</span>
                    <div>
                      <p className="text-xs text-gray-500">Walk</p>
                      <p className="text-lg font-semibold text-green-600">
                        {profile.travelTime.walking} min
                      </p>
                    </div>
                  </div>
                )}
                {profile.travelTime.bus !== undefined && profile.travelTime.bus > 0 && (
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-2xl mr-2">🚌</span>
                    <div>
                      <p className="text-xs text-gray-500">Bus</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {profile.travelTime.bus} min
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Rating
            </h3>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-2xl">
                  {star <= profile.rating ? '⭐' : '☆'}
                </span>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {profile.rating} / 5
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {profile.ratingComment}
              </p>
            </div>
          </div>

          {/* Required Questions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Internship Experience
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  What made this internship experience unique or different from what you expected?
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {profile.question1_whatMadeUnique}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  What was the most meaningful project or contribution you made during your internship?
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {profile.question2_meaningfulContribution}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  What skills or insights did you gain that you couldn't have learned in a traditional classroom?
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {profile.question3_skillsLearned}
                </p>
              </div>
            </div>
          </div>

          {/* Optional Questions */}
          {(profile.question4_mostSurprising || profile.question5_specificMoment || profile.question6_futureGoals) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Additional Insights
              </h3>
              <div className="space-y-4">
                {profile.question4_mostSurprising && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      What was the most surprising or unexpected thing you discovered during this internship?
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {profile.question4_mostSurprising}
                    </p>
                  </div>
                )}
                {profile.question5_specificMoment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Describe a specific moment or project where you felt you made a real impact.
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {profile.question5_specificMoment}
                    </p>
                  </div>
                )}
                {profile.question6_futureGoals && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      How has this internship influenced your future goals or career interests?
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {profile.question6_futureGoals}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos Slideshow */}
          {profile.photos && profile.photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Photos ({profile.photos.length})
              </h3>
              <div className="relative">
                {/* Main Photo Display */}
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mb-3">
                  <img
                    src={profile.photos[currentPhotoIndex]}
                    alt={`Photo ${currentPhotoIndex + 1} of ${profile.photos.length}`}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={handlePhotoClick}
                  />
                  
                  {/* Navigation Arrows */}
                  {profile.photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        aria-label="Previous photo"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                        aria-label="Next photo"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* Photo Counter */}
                  {profile.photos.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {profile.photos.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {profile.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {profile.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                          index === currentPhotoIndex
                            ? 'border-yellow-500 ring-2 ring-yellow-300'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-yellow-600 hover:text-yellow-700 underline"
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {isFullscreen && profile.photos && (
        <div
          className="fixed inset-0 z-[10000] bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close fullscreen"
          >
            <svg
              className="w-8 h-8"
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
          
          {profile.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousPhoto();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 text-white p-3 rounded-full hover:bg-opacity-30 transition-opacity"
                aria-label="Previous photo"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 text-white p-3 rounded-full hover:bg-opacity-30 transition-opacity"
                aria-label="Next photo"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
          
          <img
            src={profile.photos[currentPhotoIndex]}
            alt={`Photo ${currentPhotoIndex + 1} of ${profile.photos.length}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {profile.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {currentPhotoIndex + 1} / {profile.photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

