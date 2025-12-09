export const sanitizeURL = (link: string | null | undefined) => {
  if (!link) return '';

  try {
    // Try to parse as URL to extract just the hostname
    let urlString = link.trim();

    // Add protocol if missing to make it a valid URL
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = `https://${urlString}`;
    }

    const url = new URL(urlString);
    // Return just the hostname without www.
    return url.hostname.replace(/^www\./, '');
  } catch {
    // Fallback to original logic if URL parsing fails
    return link.replace(/(https?:\/\/)|(www\.)/g, '').replace(/\/$/, '');
  }
};

export const getLogoUrlFromDomainName = (
  domainName?: string,
): string | undefined => {
  const sanitizedDomain = sanitizeURL(domainName);
  return sanitizedDomain
    ? `https://twenty-icons.com/${sanitizedDomain}`
    : undefined;
};
