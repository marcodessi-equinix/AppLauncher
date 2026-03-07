const fallbackHash = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const getClientFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency,
    // Add canvas fingerprint for more uniqueness if needed, keeping it simple for now
    (new Date()).getTimezoneOffset()
  ];

  const fingerprintString = components.join('|');

  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.digest !== 'function') {
    return fallbackHash(fingerprintString);
  }

  try {
    const msgBuffer = new TextEncoder().encode(fingerprintString);
    const hashBuffer = await subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return fallbackHash(fingerprintString);
  }
};
