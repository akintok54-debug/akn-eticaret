export function isValidTurkishIban(value: string): boolean {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + "2927" + iban.slice(2, 4);
  let remainder = 0;
  for (const digit of rearranged) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
