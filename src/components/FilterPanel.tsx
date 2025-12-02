import { useState, useRef, useEffect } from 'react';
import { INTERNSHIP_FIELDS } from '../utils/validation';

interface FilterPanelProps {
  // Location type filter props
  locationType: 'all' | 'physical' | 'remote';
  onLocationTypeChange: (type: 'all' | 'physical' | 'remote') => void;
  // Travel time filter props
  filterType: 'all' | 'driving' | 'walking' | 'bus';
  filterTime: number;
  onFilterTypeChange: (type: 'all' | 'driving' | 'walking' | 'bus') => void;
  onFilterTimeChange: (time: number) => void;
  // Field filter props
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export default function FilterPanel({
  locationType,
  onLocationTypeChange,
  filterType,
  filterTime,
  onFilterTypeChange,
  onFilterTimeChange,
  selectedFields,
  onFieldsChange,
}: FilterPanelProps) {
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFieldDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      onFieldsChange(selectedFields.filter((f) => f !== field));
    } else {
      onFieldsChange([...selectedFields, field]);
    }
  };

  const handleRemoveField = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFieldsChange(selectedFields.filter((f) => f !== field));
  };

  const handleClearAll = () => {
    onFieldsChange([]);
    onFilterTypeChange('all');
    onLocationTypeChange('all');
    setSearchQuery('');
  };

  // Filter available fields based on search query (already sorted alphabetically from INTERNSHIP_FIELDS)
  const availableFields = INTERNSHIP_FIELDS.filter(
    (field) => 
      !selectedFields.includes(field) &&
      (searchQuery === '' || field.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasActiveFilters = locationType !== 'all' || filterType !== 'all' || selectedFields.length > 0;

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Location Type Filter Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Location Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onLocationTypeChange('all')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                locationType === 'all'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onLocationTypeChange('physical')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                locationType === 'physical'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Physical
            </button>
            <button
              onClick={() => onLocationTypeChange('remote')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                locationType === 'remote'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Remote
            </button>
          </div>
        </div>

        {/* Field Filter Section */}
        <div ref={dropdownRef}>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Internship Field
          </label>
          
          {/* Selected Pills */}
          {selectedFields.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  <span className="capitalize">{field}</span>
                  <button
                    onClick={(e) => handleRemoveField(field, e)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-yellow-200 focus:outline-none"
                  >
                    <svg
                      className="w-3 h-3"
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
                </span>
              ))}
            </div>
          )}

          {/* Dropdown Toggle */}
          <button
            onClick={() => {
              setIsFieldDropdownOpen(!isFieldDropdownOpen);
              if (!isFieldDropdownOpen) {
                setSearchQuery('');
              }
            }}
            className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center justify-between text-sm"
          >
            <span className="text-gray-500">
              {selectedFields.length === 0
                ? 'Select fields...'
                : `${selectedFields.length} field${selectedFields.length !== 1 ? 's' : ''} selected`}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isFieldDropdownOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isFieldDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
              {/* Search Bar */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Fields List */}
              <div className="max-h-48 overflow-y-auto">
                {availableFields.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    {searchQuery ? 'No fields found' : 'All fields selected'}
                  </div>
                ) : (
                  <div className="p-2">
                    {availableFields.map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          handleFieldToggle(field);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 rounded-md transition-colors capitalize"
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Travel Time Filter Section */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Travel Time from School
          </label>
          
          {/* Transport Mode Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => onFilterTypeChange('all')}
              className={`col-span-2 px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterTypeChange('driving')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'driving'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚗 Car
            </button>
            <button
              onClick={() => onFilterTypeChange('walking')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'walking'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚶 Walk
            </button>
            <button
              onClick={() => onFilterTypeChange('bus')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'bus'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚌 Bus
            </button>
          </div>

          {/* Time Filter */}
          {filterType !== 'all' && (
            <>
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Max Time: {filterTime} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={filterTime}
                  onChange={(e) => onFilterTimeChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onFilterTimeChange(15)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filterTime === 15
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  15 min
                </button>
                <button
                  onClick={() => onFilterTimeChange(30)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filterTime === 30
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  30 min
                </button>
                <button
                  onClick={() => onFilterTimeChange(45)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filterTime === 45
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  45 min
                </button>
                <button
                  onClick={() => onFilterTimeChange(60)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filterTime === 60
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  60 min
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

