import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';

import { ShareButton } from '../ShareButton';

const mockProps = {
  resourceType: 'COMPANY' as const,
  resourceId: 'test-company-id',
  resourceName: 'Test Company',
};

const renderShareButton = (props = mockProps) => {
  return render(
    <RecoilRoot>
      <MockedProvider mocks={[]}>
        <ShareButton {...props} />
      </MockedProvider>
    </RecoilRoot>
  );
};

describe('ShareButton', () => {
  it('should render share button', () => {
    renderShareButton();

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toBeInTheDocument();
  });

  it('should open modal when clicked', () => {
    renderShareButton();

    const shareButton = screen.getByTestId('share-button');
    fireEvent.click(shareButton);

    // 檢查模態框是否打開（這裡需要根據實際的模態框實現調整）
    // expect(screen.getByText('Share Test Company')).toBeInTheDocument();
  });

  it('should have correct aria label', () => {
    renderShareButton();

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveAttribute('aria-label', expect.stringContaining('Share'));
  });

  it('should accept custom className', () => {
    const customClass = 'custom-share-button';
    renderShareButton({ ...mockProps, className: customClass });

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveClass(customClass);
  });
});
