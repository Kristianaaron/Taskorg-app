import { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { Cloud } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: Props) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      // Ignore user-cancelled popup
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="px-6 py-8 flex flex-col items-center text-center gap-5">
        <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
          <Cloud size={18} className="text-white dark:text-black" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sign in to sync</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your boards will sync across all your devices in real time.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-black/15 dark:border-gray-600 rounded-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {/* Google logo */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Your data is private and only accessible by you.
        </p>
      </div>
    </Modal>
  );
}
