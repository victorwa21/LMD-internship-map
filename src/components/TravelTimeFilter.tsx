interface TravelTimeFilterProps {
  filterType: 'all' | 'driving' | 'walking' | 'bus';
  filterTime: number;
  onFilterTypeChange: (type: 'all' | 'driving' | 'walking' | 'bus') => void;
  onFilterTimeChange: (time: number) => void;
}

export default function TravelTimeFilter({
  filterType,
  filterTime,
  onFilterTypeChange,
  onFilterTimeChange,
}: TravelTimeFilterProps) {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs w-64 md:w-80">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Travel Time</h3>
      
      <div className="space-y-3">
        {/* Filter Type */}
        <div>
          <label className="block text-xs text-gray-600 mb-2">Transport Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFilterTypeChange('all')}
              className={`col-span-2 px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterTypeChange('driving')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'driving'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚗 Car
            </button>
            <button
              onClick={() => onFilterTypeChange('walking')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'walking'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚶 Walk
            </button>
            <button
              onClick={() => onFilterTypeChange('bus')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filterType === 'bus'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚌 Bus
            </button>
          </div>
        </div>

        {/* Time Filter */}
        {filterType !== 'all' && (
          <div>
            <label className="block text-xs text-gray-600 mb-2">
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
        )}

        {/* Quick Filters */}
        {filterType !== 'all' && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onFilterTimeChange(15)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filterTime === 15
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              15 min
            </button>
            <button
              onClick={() => onFilterTimeChange(30)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filterTime === 30
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              30 min
            </button>
            <button
              onClick={() => onFilterTimeChange(45)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filterTime === 45
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              45 min
            </button>
            <button
              onClick={() => onFilterTimeChange(60)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filterTime === 60
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              60 min
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

