import { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, HelpCircle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseCommand, commandFeedback, type ParsedCommand } from '../../utils/commandParser';
import { useBoardContext } from '../../context/BoardContext';

// ─── Example hints shown in the help panel ───────────────────────────────────

const HINTS: { label: string; example: string }[] = [
  { label: 'Add task',       example: '"Add homepage redesign to To Do"' },
  { label: 'Move task',      example: '"Move homepage redesign to Done"' },
  { label: 'Delete task',    example: '"Delete homepage redesign"' },
  { label: 'Rename task',    example: '"Rename homepage redesign to Landing page"' },
  { label: 'Description',    example: '"Set homepage description to needs review"' },
  { label: 'Checklist item', example: '"Add write tests to homepage checklist"' },
  { label: 'Add tag',        example: '"Add tag urgent to homepage redesign"' },
  { label: 'Tag task',       example: '"Tag homepage redesign with urgent"' },
  { label: 'Remove tag',     example: '"Remove tag urgent from homepage redesign"' },
  { label: 'Create tag/pill',example: '"Create tag urgent red"' },
  { label: 'New column',     example: '"Create column Blocked"' },
];

// ─── Status type ─────────────────────────────────────────────────────────────

type Status = 'idle' | 'listening' | 'success' | 'error';

// ─── Component ───────────────────────────────────────────────────────────────

export function VoiceCommand() {
  const {
    activeBoard,
    createTask,
    deleteTask,
    updateTask,
    createTag,
    createColumn,
    addChecklistItem,
  } = useBoardContext();

  const [status, setStatus]       = useState<Status>('idle');
  const [feedback, setFeedback]   = useState('');
  const [showHelp, setShowHelp]   = useState(false);
  const dismissRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleIdle = useCallback((ms: number) => {
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => {
      setStatus('idle');
      setFeedback('');
    }, ms);
  }, []);

  // ── Execute a parsed command ──────────────────────────────────────────────

  const executeCommand = useCallback((cmd: ParsedCommand) => {
    if (!activeBoard) return;

    if (cmd.type === 'ERROR') {
      setFeedback(cmd.message);
      setStatus('error');
      scheduleIdle(4000);
      return;
    }

    setFeedback(commandFeedback(cmd));
    setStatus('success');

    switch (cmd.type) {
      case 'ADD_TASK':
        createTask(cmd.column.id, cmd.taskTitle);
        break;

      case 'DELETE_TASK':
        deleteTask(cmd.task.id);
        break;

      case 'MOVE_TASK': {
        const inTarget = activeBoard.tasks.filter(t => t.columnId === cmd.column.id);
        const maxOrder = inTarget.length ? Math.max(...inTarget.map(t => t.order)) : -1;
        updateTask({ ...cmd.task, columnId: cmd.column.id, order: maxOrder + 1 });
        break;
      }

      case 'RENAME_TASK':
        updateTask({ ...cmd.task, title: cmd.newTitle });
        break;

      case 'SET_DESCRIPTION':
        updateTask({ ...cmd.task, description: cmd.description });
        break;

      case 'ADD_CHECKLIST_ITEM':
        addChecklistItem(cmd.task, cmd.text);
        break;

      case 'ADD_TAG_TO_TASK':
        if (!cmd.task.tagIds.includes(cmd.tag.id)) {
          updateTask({ ...cmd.task, tagIds: [...cmd.task.tagIds, cmd.tag.id] });
        }
        break;

      case 'REMOVE_TAG_FROM_TASK':
        updateTask({ ...cmd.task, tagIds: cmd.task.tagIds.filter(id => id !== cmd.tag.id) });
        break;

      case 'CREATE_TAG':
        createTag(cmd.name, cmd.color);
        break;

      case 'CREATE_COLUMN':
        createColumn(cmd.title);
        break;
    }

    scheduleIdle(2500);
  }, [activeBoard, createTask, deleteTask, updateTask, createTag, createColumn, addChecklistItem, scheduleIdle]);

  // ── Handle final transcript ───────────────────────────────────────────────

  const handleResult = useCallback((transcript: string) => {
    if (!activeBoard) return;
    const cmd = parseCommand(transcript, activeBoard);
    executeCommand(cmd);
  }, [activeBoard, executeCommand]);

  const { isListening, transcript, supported, error, start, stop, reset } =
    useSpeechRecognition(handleResult);

  // Handle speech recognition errors (e.g. no-speech, not-allowed)
  useEffect(() => {
    if (!error) return;
    const msg = error === 'no-speech'
      ? 'No speech detected. Try again.'
      : error === 'not-allowed'
        ? 'Microphone access denied.'
        : `Mic error: ${error}`;
    setFeedback(msg);
    setStatus('error');
    scheduleIdle(3500);
  }, [error, scheduleIdle]);

  // If recognition ends without a final result, clear the listening state
  useEffect(() => {
    if (!isListening && status === 'listening') {
      scheduleIdle(500);
    }
  }, [isListening, status, scheduleIdle]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (dismissRef.current) clearTimeout(dismissRef.current);
  }, []);

  // ── Mic button handler ────────────────────────────────────────────────────

  const handleMicClick = () => {
    if (isListening) {
      stop();
      return;
    }
    reset();
    setStatus('listening');
    setFeedback('');
    setShowHelp(false);
    start();
  };

  if (!supported) return null;

  const panelVisible = isListening || (status !== 'idle');

  // Safe-area-aware bottom offset shared by fixed elements
  const safeBottom = 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)';

  return (
    <>
      {/* ── Help panel ────────────────────────────────────────────────────── */}
      {showHelp && (
        <div
          className="fixed right-4 z-50 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Voice commands
            </span>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-80 overflow-y-auto">
            {HINTS.map(({ label, example }) => (
              <li key={label} className="px-4 py-2.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic">{example}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Transcript / feedback toast ───────────────────────────────────── */}
      {panelVisible && (
        <div
          className="fixed left-4 right-20 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}
        >
          <div className="flex items-start gap-2.5">
            {/* Status icon */}
            {status === 'success' ? (
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            ) : status === 'error' ? (
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
              <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            )}

            {/* Message */}
            <span className={`text-sm leading-snug ${
              status === 'success' ? 'text-green-700 dark:text-green-400'
              : status === 'error' ? 'text-red-600 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-200'
            }`}>
              {feedback || transcript || 'Listening…'}
            </span>
          </div>
        </div>
      )}

      {/* ── Floating button stack ─────────────────────────────────────────── */}
      <div
        className="fixed right-4 z-50 flex flex-col items-center gap-2"
        style={{ bottom: safeBottom }}
      >
        {/* Help toggle */}
        <button
          onClick={() => setShowHelp(v => !v)}
          className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-colors ${
            showHelp
              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
          aria-label="Voice command help"
        >
          <HelpCircle size={16} />
        </button>

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            isListening
              ? 'bg-red-500 text-white ring-4 ring-red-300 dark:ring-red-800 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start voice command'}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
      </div>
    </>
  );
}
