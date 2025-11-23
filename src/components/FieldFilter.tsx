import { useState, useRef, useEffect } from 'react';
import { INTERNSHIP_FIELDS } from '../utils/validation';

interface FieldFilterProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export default function FieldFilter({
  selectedFields,
  onFieldsChange,
}: FieldFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      // Remove field
      onFieldsChange(selectedFields.filter((f) => f !== field));
    } else {
      // Add field
      onFieldsChange([...selectedFields, field]);
    }
  };

  const handleRemoveField = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFieldsChange(selectedFields.filter((f) => f !== field));
  };

  // Filter available fields based on search query
  const availableFields = INTERNSHIP_FIELDS.filter(
    (field) => 
      !selectedFields.includes(field) &&
      (searchQuery === '' || field.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute top-4 left-4 z-[1000] max-w-xs w-64 md:w-80" ref={dropdownRef}>
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Field</h3>
          
          {/* Selected Pills */}
          {selectedFields.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <span className="capitalize">{field}</span>
                  <button
                    onClick={(e) => handleRemoveField(field, e)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
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
              setIsOpen(!isOpen);
              if (!isOpen) {
                setSearchQuery(''); // Clear search when opening
              }
            }}
            className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span className="text-sm text-gray-500">
              {selectedFields.length === 0
                ? 'Select fields...'
                : `${selectedFields.length} field${selectedFields.length !== 1 ? 's' : ''} selected`}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
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
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="border-t border-gray-200">
            {/* Search Bar */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Fields List */}
            <div className="max-h-64 overflow-y-auto">
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
                        setSearchQuery(''); // Clear search after selection
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors capitalize"
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
    </div>
  );
}

