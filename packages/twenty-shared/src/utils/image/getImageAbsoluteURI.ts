type getImageAbsoluteURIProps = {
  imageUrl: string;
  baseUrl: string;
};

export const getImageAbsoluteURI = ({
  imageUrl,
  baseUrl,
}: getImageAbsoluteURIProps): string | null => {
  // Return null for empty or whitespace-only URLs to prevent 500 errors
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  if (imageUrl.startsWith('https:') || imageUrl.startsWith('http:')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/')) {
    return new URL(`/files${imageUrl}`, baseUrl).toString();
  }

  return new URL(`/files/${imageUrl}`, baseUrl).toString();
};
