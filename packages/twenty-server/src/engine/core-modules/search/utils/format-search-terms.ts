export const formatSearchTerms = (
  searchTerm: string,
  operator: 'and' | 'or' = 'and',
) => {
  if (searchTerm.trim() === '') {
    return '';
  }
  const words = searchTerm.trim().split(/\s+/);
  const formattedWords = words
    .map((word) => {
      // Remove full-width CJK brackets that cause tsquery syntax errors
      const cleanedWord = word.replace(/[（）【】「」『』《》〈〉]/g, '');

      // Escape half-width special characters (PostgreSQL tsquery syntax chars)
      // Using function form to prepend backslash to matched character
      const escapedWord = cleanedWord.replace(
        /[\\:'&|!()@<>]/g,
        (match) => '\\' + match,
      );

      return escapedWord ? `${escapedWord}:*` : '';
    })
    .filter(Boolean);

  return formattedWords.join(` ${operator === 'and' ? '&' : '|'} `);
};
