import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Loader } from '@/ui/feedback/loader/components/Loader';
import { Button } from '@/ui/input/button/components/Button';
import { IconAlertCircle, IconLock } from 'twenty-ui/display';

import { useGetSharedContent } from '../hooks/useGetSharedContent';
import { ExternalAuthForm } from './ExternalAuthForm';
import { ExternalContentRenderer } from './ExternalContentRenderer';

export const ExternalViewer: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

  const { content, loading, error } = useGetSharedContent(
    token || '',
    authToken,
  );

  const handleAuthenticated = (newAuthToken: string) => {
    setAuthToken(newAuthToken);
    setShowAuthForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">{t`Loading shared content...`}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthRequired = error.message.includes('Authentication required');

    if (isAuthRequired && !showAuthForm) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <IconLock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t`Authentication Required`}
            </h2>
            <p className="text-gray-600 mb-6">
              {t`This shared content requires authentication to access.`}
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAuthForm(true)}
              className="w-full"
            >
              {t`Sign In to Continue`}
            </Button>
          </div>
        </div>
      );
    }

    if (showAuthForm) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <ExternalAuthForm
            onAuthenticated={handleAuthenticated}
            onCancel={() => setShowAuthForm(false)}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <IconAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t`Content Not Available`}
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || t`The shared content you're looking for is not available.`}
          </p>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            {t`Try Again`}
          </Button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <IconAlertCircle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t`Content Not Found`}
          </h2>
          <p className="text-gray-600">
            {t`The shared content you're looking for does not exist or has been removed.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Y-CRM branding */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Y-CRM
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                {t`Shared Content`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {content.metadata.workspaceName}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExternalContentRenderer content={content} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {t`Shared on`} {new Date(content.metadata.sharedAt).toLocaleDateString()}
            </div>
            {content.metadata.expiresAt && (
              <div>
                {t`Expires on`} {new Date(content.metadata.expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
