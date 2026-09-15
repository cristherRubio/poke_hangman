export function titleCase(str) {
  return str
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}