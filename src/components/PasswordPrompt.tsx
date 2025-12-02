import { useState } from 'react';

interface PasswordPromptProps {
  onSuccess: () => void;
  onCancel?: () => void;
  isRequired?: boolean; // If true, user cannot cancel (must enter password)
}

export default function PasswordPrompt({ onSuccess, onCancel, isRequired = false }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const correctPassword = import.meta.env.VITE_EDIT_PASSWORD || 'student2024';
    
    if (password === correctPassword) {
      // Store authentication in sessionStorage
      sessionStorage.setItem('internship_map_authenticated', 'true');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Edit Password</h2>
        <p className="text-sm text-gray-600 mb-4">
          This password is required to add or edit profiles on the map.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter password"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {!isRequired && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Verifying...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

