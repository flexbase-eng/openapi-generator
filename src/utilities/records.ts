export const compareStringRecords = (a: Record<string, string>, b: Record<string, string>): boolean => {
  return Object.entries(a).every(x => x[1] === b[x[0]]);
};
