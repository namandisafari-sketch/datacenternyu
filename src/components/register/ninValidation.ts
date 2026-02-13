// Uganda NIN format: CM/CF + 7 digits + 3 letters + 1 digit + 1 letter = 14 chars
// Example: CM1234567ABC1Z
const NIN_REGEX = /^C[MF]\d{7}[A-Z]{3}\d[A-Z]$/;

export const isValidNIN = (nin: string): boolean => {
  if (!nin) return true; // optional field
  return NIN_REGEX.test(nin.toUpperCase());
};

export const NIN_HINT = "Format: CM or CF followed by 7 digits, 3 letters, 1 digit, 1 letter (e.g. CM1234567ABC1Z)";
