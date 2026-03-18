import { useState } from 'react';

interface Props {
  onConfirm: (name: string) => void;
}

export function GuestNameModal({ onConfirm }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border border-black/10 dark:border-gray-800 rounded-sm shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          What's your name?
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          So the board owner knows who's commenting.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="w-full text-sm bg-gray-50/60 dark:bg-gray-900/40 border border-black/10 dark:border-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-black/25 dark:focus:border-gray-500 placeholder-gray-300 dark:placeholder-gray-600 rounded-sm"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black disabled:opacity-40 hover:opacity-80 transition-opacity rounded-sm"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
