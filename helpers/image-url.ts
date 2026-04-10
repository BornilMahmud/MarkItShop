export const toDisplayImageSrc = (value?: string | null): string => {
  if (!value) {
    return '/product_placeholder.jpg';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '/product_placeholder.jpg';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const normalizeGoogleDriveLink = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const fileIdMatch = trimmed.match(/\/d\/([^/]+)\//) || trimmed.match(/[?&]id=([^&]+)/);
  if (fileIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }

  return trimmed;
};
