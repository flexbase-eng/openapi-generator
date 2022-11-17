export function capitalize(str: string) {
  const lower = str.toLowerCase();
  return str[0].toUpperCase() + lower.slice(1);
}
