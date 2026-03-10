import type { TagColor } from '../types';

export const TAG_COLOR_CLASSES: Record<TagColor, { bg: string; text: string; border: string }> = {
  red:    { bg: 'bg-red-100 dark:bg-red-900/40',    text: 'text-red-700 dark:text-red-300',    border: 'border-red-300 dark:border-red-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  green:  { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-300 dark:border-green-700' },
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-300 dark:border-blue-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink:   { bg: 'bg-pink-100 dark:bg-pink-900/40',   text: 'text-pink-700 dark:text-pink-300',   border: 'border-pink-300 dark:border-pink-700' },
  gray:   { bg: 'bg-gray-100 dark:bg-gray-700/40',   text: 'text-gray-700 dark:text-gray-300',   border: 'border-gray-300 dark:border-gray-600' },
};

export const TAG_COLOR_DOT: Record<TagColor, string> = {
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green:  'bg-green-500',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  pink:   'bg-pink-500',
  gray:   'bg-gray-500',
};

export const TAG_COLOR_OPTIONS: { label: string; value: TagColor }[] = [
  { label: 'Red', value: 'red' },
  { label: 'Orange', value: 'orange' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Pink', value: 'pink' },
  { label: 'Gray', value: 'gray' },
];
