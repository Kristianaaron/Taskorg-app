
import type { Tag } from '../../types';
import { TAG_COLOR_CLASSES } from '../../utils/tagColors';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  const colors = TAG_COLOR_CLASSES[tag.color];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 ${textSize} font-medium px-2 py-0.5 border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
          aria-label={`Remove tag ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
