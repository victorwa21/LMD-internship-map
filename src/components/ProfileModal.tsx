import { useEffect } from 'react';
import { StudentProfile } from '../types/profile';

interface ProfileModalProps {
  profile: StudentProfile | null;
  onClose: () => void;
}

export default function ProfileModal({ profile, onClose }: ProfileModalProps) {
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && profile) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [profile, onClose]);

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
            <p className="text-lg text-gray-900">{profile.internshipCompany}</p>
          </div>

          {/* Field */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Field
            </h3>
            <p className="text-gray-900 capitalize">{profile.field}</p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Internship Contact
            </h3>
            <p className="text-gray-900">{profile.internshipContactName}</p>
            <a
              href={`mailto:${profile.internshipSiteEmail}`}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              {profile.internshipSiteEmail}
            </a>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Address
            </h3>
            <p className="text-gray-900">{profile.internshipAddress.fullAddress}</p>
          </div>

          {/* Travel Time */}
          {profile.travelTime && ((profile.travelTime.driving !== undefined && profile.travelTime.driving > 0) || (profile.travelTime.walking !== undefined && profile.travelTime.walking > 0) || (profile.travelTime.bus !== undefined && profile.travelTime.bus > 0)) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Travel Time from School
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {profile.travelTime.driving !== undefined && profile.travelTime.driving > 0 && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-2xl mr-2">🚗</span>
                    <div>
                      <p className="text-xs text-gray-500">Car</p>
                      <p className="text-lg font-semibold text-blue-600">
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

          {/* Accomplishments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Accomplishments & Learnings
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {profile.accomplishments}
            </p>
          </div>

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
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

