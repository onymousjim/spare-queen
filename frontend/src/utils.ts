export const normalizePlayerName = (name: string): string => {
  const upperCaseName = name.trim().toUpperCase();
  if (['JAMEY', 'JAMIE', 'JIM'].includes(upperCaseName)) {
    return 'JIM';
  }
  return upperCaseName;
};
