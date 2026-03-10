import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-16 right-4 z-50 max-w-xs">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 flex items-center gap-3">
        <RefreshCw size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        <p className="text-xs text-gray-700 dark:text-gray-300 flex-1">
          A new version is available.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 transition-colors font-medium flex-shrink-0"
        >
          Update
        </button>
      </div>
    </div>
  );
}
