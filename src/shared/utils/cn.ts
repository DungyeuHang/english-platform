/**
 * Tiny dependency-free class name combiner.
 *
 * Filters out falsy values and joins the rest with a space, so callers
 * can safely mix conditional classes without pulling in a library.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}