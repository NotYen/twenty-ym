import { formatSearchTerms } from 'src/engine/core-modules/search/utils/format-search-terms';

describe('formatSearchTerms', () => {
  it('should format the search terms', () => {
    const formattedTerms = formatSearchTerms('my search input', 'and');

    expect(formattedTerms).toBe('my:* & search:* & input:*');
  });

  it('should format the search terms with or', () => {
    const formattedTerms = formatSearchTerms('my search input', 'or');

    expect(formattedTerms).toBe('my:* | search:* | input:*');
  });

  it('should escape half-width parentheses', () => {
    const formattedTerms = formatSearchTerms('test(value)', 'and');

    expect(formattedTerms).toBe('test\\(value\\):*');
  });

  it('should remove full-width CJK parentheses', () => {
    const formattedTerms = formatSearchTerms(
      '美升鮮-WMS倉儲管理（硬體）',
      'and',
    );

    expect(formattedTerms).toBe('美升鮮-WMS倉儲管理硬體:*');
  });

  it('should handle mixed parentheses in CJK text', () => {
    const formattedTerms = formatSearchTerms('測試(硬體)', 'and');

    expect(formattedTerms).toBe('測試\\(硬體\\):*');
  });
});
