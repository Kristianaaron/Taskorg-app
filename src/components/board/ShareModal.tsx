import { useState } from 'react';
import { Lock, Globe, Copy, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useBoardContext } from '../../context/BoardContext';
import { getSharedBoardUrl } from '../../utils/boardShare';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: Props) {
  const { activeBoard, updateBoardVisibility } = useBoardContext();
  const [copied, setCopied] = useState(false);

  if (!activeBoard) return null;

  const isPublic = activeBoard.visibility === 'public';
  const shareUrl = isPublic ? getSharedBoardUrl(activeBoard.id) : '';

  const handleVisibilityChange = (v: 'private' | 'public') => {
    updateBoardVisibility(activeBoard.id, v);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share board" size="sm">
      <div className="p-4 space-y-4">

        {/* Access options */}
        <div>
          <p className="text-xs font-sans font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Access
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => handleVisibilityChange('private')}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-sm border text-left transition-colors ${
                !isPublic
                  ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                  : 'border-black/10 dark:border-gray-700 hover:bg-black/3 dark:hover:bg-white/3'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Lock size={15} className={!isPublic ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'} />
              </div>
              <div>
                <p className={`text-sm font-medium ${!isPublic ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  Private
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Only visible to you. Not shareable.
                </p>
              </div>
              {!isPublic && (
                <Check size={14} className="ml-auto mt-0.5 flex-shrink-0 text-black dark:text-white" />
              )}
            </button>

            <button
              onClick={() => handleVisibilityChange('public')}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-sm border text-left transition-colors ${
                isPublic
                  ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                  : 'border-black/10 dark:border-gray-700 hover:bg-black/3 dark:hover:bg-white/3'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Globe size={15} className={isPublic ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isPublic ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  Public
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Anyone with the link can view live and leave comments.
                </p>
              </div>
              {isPublic && (
                <Check size={14} className="ml-auto mt-0.5 flex-shrink-0 text-black dark:text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Link section — only when public */}
        {isPublic && (
          <div>
            <p className="text-xs font-sans font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              Share link
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-xs bg-black/4 dark:bg-white/5 border border-black/10 dark:border-gray-700 rounded-sm px-2.5 py-2 text-gray-600 dark:text-gray-300 focus:outline-none truncate"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-sm border transition-colors flex-shrink-0 ${
                  copied
                    ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                    : 'border-black/15 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-black/8 dark:border-gray-800 pt-3">
          {isPublic
            ? 'Recipients see your board live. Their comments appear on your cards in real-time.'
            : 'Switch to Public to generate a shareable link.'}
        </p>
      </div>
    </Modal>
  );
}
