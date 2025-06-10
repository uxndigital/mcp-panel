type ClassValue = string | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes.flat(10).filter(Boolean).join(" ");
}
