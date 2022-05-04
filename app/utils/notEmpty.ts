export function notEmpty<T>(value: T | null | undefined): value is T {
    if (value === null || value === undefined) return false;
    const testDummy: T = value;
    return true;
  }