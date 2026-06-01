export function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}
