import type { Board, Task, Column, Tag, TagColor } from '../types';

// ─── Result types ────────────────────────────────────────────────────────────

export type ParsedCommand =
  | { type: 'ADD_TASK';             taskTitle: string; column: Column }
  | { type: 'DELETE_TASK';          task: Task }
  | { type: 'MOVE_TASK';            task: Task; column: Column }
  | { type: 'RENAME_TASK';          task: Task; newTitle: string }
  | { type: 'SET_DESCRIPTION';      task: Task; description: string }
  | { type: 'ADD_CHECKLIST_ITEM';   task: Task; text: string }
  | { type: 'ADD_TAG_TO_TASK';      task: Task; tag: Tag }
  | { type: 'REMOVE_TAG_FROM_TASK'; task: Task; tag: Tag }
  | { type: 'CREATE_TAG';           name: string; color: TagColor }
  | { type: 'CREATE_COLUMN';        title: string }
  | { type: 'ERROR';                message: string };

// ─── Fuzzy matching helpers ───────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const next = a[i - 1] === b[j - 1]
        ? row[j - 1]
        : 1 + Math.min(prev, row[j], row[j - 1]);
      row[j - 1] = prev;
      prev = next;
    }
    row[n] = prev;
  }
  return row[n];
}

function fuzzyFind<T>(items: T[], getName: (i: T) => string, query: string): T | null {
  if (!query) return null;
  const q = norm(query);
  const scored = items.map(item => {
    const name = norm(getName(item));
    if (name === q) return { item, score: 0 };
    if (name.includes(q) || q.includes(name)) return { item, score: 1 };
    const dist = levenshtein(name, q);
    return { item, score: dist <= 3 ? dist + 2 : Infinity };
  });
  const best = scored.reduce((a, b) => (a.score <= b.score ? a : b));
  return best.score < Infinity ? best.item : null;
}

/**
 * Return every possible [left, right] split of `text` on the word `sep`
 * (space-delimited), ordered so that splits with longer left parts come first —
 * this makes greedy task-name matching more natural.
 */
function splitOn(text: string, sep: string): [string, string][] {
  const marker = ` ${sep} `;
  const results: [string, string][] = [];
  let idx = 0;
  while (true) {
    const i = text.indexOf(marker, idx);
    if (i === -1) break;
    results.push([text.slice(0, i).trim(), text.slice(i + marker.length).trim()]);
    idx = i + 1;
  }
  // Longest task-name first (most specific split)
  return results.reverse();
}

// ─── Main parser ─────────────────────────────────────────────────────────────

const TAG_COLORS: TagColor[] = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray',
];

export function parseCommand(raw: string, board: Board): ParsedCommand {
  const txt = norm(raw).replace(/[.,!?]+$/, '');
  const { tasks, columns, tags } = board;

  const findTask   = (q: string) => fuzzyFind(tasks,   t => t.title, q);
  const findColumn = (q: string) => fuzzyFind(columns, c => c.title, q);
  const findTag    = (q: string) => fuzzyFind(tags,    g => g.name,  q);

  let m: RegExpMatchArray | null;

  // ── CREATE TAG / PILL ────────────────────────────────────────────────────
  // "create tag urgent red" / "new pill design blue" / "create label bug"
  if ((m = txt.match(
    /^(?:create|add|new)(?: a)? (?:tag|pill|label) (.+?)(?:\s+(red|orange|yellow|green|blue|purple|pink|gray))?$/,
  ))) {
    const color = (TAG_COLORS.find(c => c === m![2]) ?? 'blue') as TagColor;
    return { type: 'CREATE_TAG', name: m[1].trim(), color };
  }

  // ── CREATE COLUMN ────────────────────────────────────────────────────────
  // "create column Blocked" / "add column Review"
  if ((m = txt.match(/^(?:create|add|new)(?: a)? column (.+)$/))) {
    return { type: 'CREATE_COLUMN', title: m[1].trim() };
  }

  // ── ADD TASK ─────────────────────────────────────────────────────────────
  // "add homepage redesign to To Do" / "create task Write tests in Done"
  if ((m = txt.match(/^(?:add|create|new)(?: a)?(?: task)? (.+)$/))) {
    const rest = m[1];
    for (const sep of ['to', 'in', 'into']) {
      for (const [taskPart, colPart] of splitOn(rest, sep)) {
        const col = findColumn(colPart);
        if (col) return { type: 'ADD_TASK', taskTitle: taskPart, column: col };
      }
    }
    // No column keyword — default to first column
    if (columns.length > 0) {
      return { type: 'ADD_TASK', taskTitle: rest, column: columns[0] };
    }
    return { type: 'ERROR', message: `Which column? Try: "add ${rest} to [column]"` };
  }

  // ── MOVE TASK ────────────────────────────────────────────────────────────
  // "move Homepage redesign to Done" / "move task Write tests into In Progress"
  if ((m = txt.match(/^move(?: task)? (.+)$/))) {
    for (const sep of ['to', 'into']) {
      for (const [taskPart, colPart] of splitOn(m[1], sep)) {
        const task = findTask(taskPart);
        const col  = findColumn(colPart);
        if (task && col) return { type: 'MOVE_TASK', task, column: col };
      }
    }
    return { type: 'ERROR', message: `Couldn't match task and column. Try: "move [task] to [column]"` };
  }

  // ── DELETE TASK ──────────────────────────────────────────────────────────
  // "delete homepage redesign" / "remove task Write tests"
  if ((m = txt.match(/^(?:delete|remove)(?: task)? (.+)$/))) {
    const task = findTask(m[1]);
    if (!task) return { type: 'ERROR', message: `Task "${m[1]}" not found` };
    return { type: 'DELETE_TASK', task };
  }

  // ── RENAME TASK ──────────────────────────────────────────────────────────
  // "rename Homepage to Landing page"
  if ((m = txt.match(/^rename(?: task)? (.+)$/))) {
    for (const [taskPart, newTitle] of splitOn(m[1], 'to')) {
      if (!newTitle) continue;
      const task = findTask(taskPart);
      if (task) return { type: 'RENAME_TASK', task, newTitle };
    }
    return { type: 'ERROR', message: `Try: "rename [task] to [new name]"` };
  }

  // ── SET DESCRIPTION ──────────────────────────────────────────────────────
  // "set homepage description to needs a full redesign"
  // "update task write tests description needs unit and integration coverage"
  if ((m = txt.match(/^(?:set|update|change)(?: task)? (.+?) description(?:\s+to)?\s+(.+)$/))) {
    const task = findTask(m[1]);
    if (!task) return { type: 'ERROR', message: `Task "${m[1]}" not found` };
    return { type: 'SET_DESCRIPTION', task, description: m[2].trim() };
  }

  // ── ADD CHECKLIST ITEM ───────────────────────────────────────────────────
  // "add write unit tests to homepage checklist"
  if ((m = txt.match(/^add (.+?) to(?: task)? (.+?) checklist$/))) {
    const task = findTask(m[2]);
    if (!task) return { type: 'ERROR', message: `Task "${m[2]}" not found` };
    return { type: 'ADD_CHECKLIST_ITEM', task, text: m[1].trim() };
  }
  // "add checklist item write unit tests to homepage"
  if ((m = txt.match(/^add checklist(?: item)? (.+?) to(?: task)? (.+)$/))) {
    const task = findTask(m[2]);
    if (!task) return { type: 'ERROR', message: `Task "${m[2]}" not found` };
    return { type: 'ADD_CHECKLIST_ITEM', task, text: m[1].trim() };
  }

  // ── ADD TAG TO TASK ──────────────────────────────────────────────────────
  // "add tag urgent to homepage" / "tag homepage with urgent"
  if ((m = txt.match(/^add(?: the)? tag (.+?) to(?: task)? (.+)$/))) {
    const tag  = findTag(m[1]);
    const task = findTask(m[2]);
    if (!tag)  return { type: 'ERROR', message: `Tag "${m[1]}" not found. Create it first: "create tag ${m[1]}"` };
    if (!task) return { type: 'ERROR', message: `Task "${m[2]}" not found` };
    return { type: 'ADD_TAG_TO_TASK', task, tag };
  }
  if ((m = txt.match(/^tag(?: task)? (.+) with (.+)$/))) {
    const task = findTask(m[1]);
    const tag  = findTag(m[2]);
    if (!task) return { type: 'ERROR', message: `Task "${m[1]}" not found` };
    if (!tag)  return { type: 'ERROR', message: `Tag "${m[2]}" not found. Create it first: "create tag ${m[2]}"` };
    return { type: 'ADD_TAG_TO_TASK', task, tag };
  }

  // ── REMOVE TAG FROM TASK ─────────────────────────────────────────────────
  // "remove tag urgent from homepage"
  if ((m = txt.match(/^remove(?: the)? tag (.+?) from(?: task)? (.+)$/))) {
    const tag  = findTag(m[1]);
    const task = findTask(m[2]);
    if (!tag)  return { type: 'ERROR', message: `Tag "${m[1]}" not found` };
    if (!task) return { type: 'ERROR', message: `Task "${m[2]}" not found` };
    return { type: 'REMOVE_TAG_FROM_TASK', task, tag };
  }

  return { type: 'ERROR', message: `Didn't understand: "${raw}". Tap ? for examples.` };
}

// ─── Human-readable feedback strings ────────────────────────────────────────

export function commandFeedback(cmd: ParsedCommand): string {
  switch (cmd.type) {
    case 'ADD_TASK':             return `Added "${cmd.taskTitle}" to ${cmd.column.title}`;
    case 'DELETE_TASK':          return `Deleted "${cmd.task.title}"`;
    case 'MOVE_TASK':            return `Moved "${cmd.task.title}" → ${cmd.column.title}`;
    case 'RENAME_TASK':          return `Renamed to "${cmd.newTitle}"`;
    case 'SET_DESCRIPTION':      return `Description updated on "${cmd.task.title}"`;
    case 'ADD_CHECKLIST_ITEM':   return `Added "${cmd.text}" to ${cmd.task.title}`;
    case 'ADD_TAG_TO_TASK':      return `Tagged "${cmd.task.title}" with ${cmd.tag.name}`;
    case 'REMOVE_TAG_FROM_TASK': return `Removed ${cmd.tag.name} from "${cmd.task.title}"`;
    case 'CREATE_TAG':           return `Created ${cmd.color} tag "${cmd.name}"`;
    case 'CREATE_COLUMN':        return `Created column "${cmd.title}"`;
    case 'ERROR':                return cmd.message;
  }
}
