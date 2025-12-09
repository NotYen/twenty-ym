import {
    getLogoUrlFromDomainName,
    sanitizeURL,
} from '@/utils/image/getLogoUrlFromDomainName';

describe('sanitizeURL', () => {
  test('should sanitize the URL correctly', () => {
    expect(sanitizeURL('http://example.com/')).toBe('example.com');
    expect(sanitizeURL('https://www.example.com/')).toBe('example.com');
    expect(sanitizeURL('www.example.com')).toBe('example.com');
    expect(sanitizeURL('example.com')).toBe('example.com');
    expect(sanitizeURL('example.com/')).toBe('example.com');
  });

  test('should extract domain from full URL with path', () => {
    // This is the key fix - URLs with paths should only return the domain
    expect(sanitizeURL('https://twincn.com/item.aspx?no=54225358')).toBe(
      'twincn.com',
    );
    expect(sanitizeURL('http://example.com/page/subpage?query=1')).toBe(
      'example.com',
    );
    expect(sanitizeURL('https://www.google.com/search?q=test')).toBe(
      'google.com',
    );
  });

  test('should handle undefined input', () => {
    expect(sanitizeURL(undefined)).toBe('');
  });
});

describe('getLogoUrlFromDomainName', () => {
  test('should return the correct logo URL for a given domain', () => {
    expect(getLogoUrlFromDomainName('example.com')).toBe(
      'https://twenty-icons.com/example.com',
    );

    expect(getLogoUrlFromDomainName('http://example.com/')).toBe(
      'https://twenty-icons.com/example.com',
    );

    expect(getLogoUrlFromDomainName('https://www.example.com/')).toBe(
      'https://twenty-icons.com/example.com',
    );

    expect(getLogoUrlFromDomainName('www.example.com')).toBe(
      'https://twenty-icons.com/example.com',
    );

    expect(getLogoUrlFromDomainName('example.com/')).toBe(
      'https://twenty-icons.com/example.com',
    );

    expect(getLogoUrlFromDomainName('apple.com')).toBe(
      'https://twenty-icons.com/apple.com',
    );
  });

  test('should handle undefined input', () => {
    expect(getLogoUrlFromDomainName(undefined)).toBe(undefined);
  });
});
