export function shouldMaskContactDetails(hasProjectDeposit: boolean): boolean {
  return !hasProjectDeposit;
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, 2) + "*".repeat(phone.length - 4) + phone.slice(-2);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  return local[0] + "***@" + domain;
}
