import {
    ApolloClient,
    type ApolloClientOptions,
    ApolloLink,
    type FetchResult,
    fromPromise,
    type Observable,
    type Operation,
    type ServerError,
    type ServerParseError,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { RestLink } from 'apollo-link-rest';
import { createUploadLink } from 'apollo-upload-client';

import { renewToken } from '@/auth/services/AuthService';
import { type CurrentWorkspaceMember } from '@/auth/states/currentWorkspaceMemberState';
import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { type AuthTokenPair } from '~/generated/graphql';

import { REST_API_BASE_URL } from '@/apollo/constant/rest-api-base-url';
import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { i18n } from '@lingui/core';
import { t } from '@lingui/core/macro';
import {
    type DefinitionNode,
    type DirectiveNode,
    type GraphQLFormattedError,
    type SelectionNode,
} from 'graphql';
import isEmpty from 'lodash.isempty';
import { getGenericOperationName, isDefined } from 'twenty-shared/utils';
import { cookieStorage } from '~/utils/cookie-storage';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';
import { type ApolloManager } from '../types/apolloManager.interface';
import { loggerLink } from '../utils/loggerLink';
import { StreamingRestLink } from '../utils/streamingRestLink';

const logger = loggerLink(() => 'Twenty');

export interface Options<TCacheShape> extends ApolloClientOptions<TCacheShape> {
  onError?: (err: readonly GraphQLFormattedError[] | undefined) => void;
  onNetworkError?: (err: Error | ServerParseError | ServerError) => void;
  onTokenPairChange?: (tokenPair: AuthTokenPair) => void;
  onUnauthenticatedError?: () => void;
  onAppVersionMismatch?: (message: string) => void;
  currentWorkspaceMember: CurrentWorkspaceMember | null;
  currentWorkspace: CurrentWorkspace | null;
  extraLinks?: ApolloLink[];
  isDebugMode?: boolean;
  appVersion?: string;
}

export class ApolloFactory<TCacheShape> implements ApolloManager<TCacheShape> {
  private client: ApolloClient<TCacheShape>;
  private currentWorkspaceMember: CurrentWorkspaceMember | null = null;
  private currentWorkspace: CurrentWorkspace | null = null;
  private appVersion?: string;

  constructor(opts: Options<TCacheShape>) {
    const {
      uri,
      onError: onErrorCb,
      onNetworkError,
      onTokenPairChange,
      onUnauthenticatedError,
      onAppVersionMismatch,
      currentWorkspaceMember,
      currentWorkspace,
      extraLinks,
      isDebugMode,
      appVersion,
      ...options
    } = opts;

    this.currentWorkspaceMember = currentWorkspaceMember;
    this.currentWorkspace = currentWorkspace;
    this.appVersion = appVersion;

    const buildApolloLink = (): ApolloLink => {
      const uploadLink = createUploadLink({
        uri,
      });

      const streamingRestLink = new StreamingRestLink({
        uri: REST_API_BASE_URL,
      });

      const restLink = new RestLink({
        uri: REST_API_BASE_URL,
      });

      // 攔截外部分享路由的特定查詢，避免發送需要認證的請求
      const blockAuthQueriesLink = new ApolloLink((operation, forward) => {
        const isExternalShareRoute = typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/shared/');

        // 在外部分享路由中，攔截 GetWorkspaceConfigs 查詢
        if (isExternalShareRoute && operation.operationName === 'GetWorkspaceConfigs') {
          // 返回空結果，不發送到後端
          return new Observable((observer) => {
            observer.next({ data: { getWorkspaceConfigs: [] } });
            observer.complete();
          });
        }

        return forward(operation);
      });

      const authLink = setContext(async (_, { headers }) => {
        // 檢查是否是外部分享路由 - 不添加認證 header
        const isExternalShareRoute = typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/shared/');

        const tokenPair = getTokenPair();

        const locale = this.currentWorkspaceMember?.locale ?? i18n.locale;

        // 外部分享路由：只添加 locale，不添加認證
        if (isExternalShareRoute) {
          return {
            headers: {
              ...headers,
              ...options.headers,
              'x-locale': locale,
            },
          };
        }

        if (isUndefinedOrNull(tokenPair)) {
          return {
            headers: {
              ...headers,
              ...options.headers,
              'x-locale': locale,
            },
          };
        }

        const token = tokenPair.accessOrWorkspaceAgnosticToken?.token;

        return {
          headers: {
            ...headers,
            ...options.headers,
            authorization: token ? `Bearer ${token}` : '',
            'x-locale': locale,
            ...(this.currentWorkspace?.metadataVersion && {
              'X-Schema-Version': `${this.currentWorkspace.metadataVersion}`,
            }),
            ...(this.appVersion && { 'X-App-Version': this.appVersion }),
          },
        };
      });

      const retryLink = new RetryLink({
        delay: {
          initial: 3000,
        },
        attempts: {
          max: 2,
          retryIf: (error) => {
            if (this.isAuthenticationError(error)) {
              return false;
            }
            return Boolean(error);
          },
        },
      });

      const handleTokenRenewal = (
        operation: Operation,
        forward: (operation: Operation) => Observable<FetchResult>,
      ) => {
        return fromPromise(
          renewToken(uri, getTokenPair())
            .then((tokens) => {
              if (isDefined(tokens)) {
                onTokenPairChange?.(tokens);
                cookieStorage.setItem('tokenPair', JSON.stringify(tokens));
              }
            })
            .catch(() => {
              onUnauthenticatedError?.();
            }),
        ).flatMap(() => forward(operation));
      };

      const sendToSentry = ({
        graphQLError,
        operation,
      }: {
        graphQLError: GraphQLFormattedError;
        operation: Operation;
      }) => {
        if (isDebugMode === true) {
          // GraphQL error debug info
        }
        import('@sentry/react')
          .then(({ captureException, withScope }) => {
            withScope((scope) => {
              const error = new Error(graphQLError.message);

              error.name = graphQLError.message;

              const fingerPrint: string[] = [];
              if (isDefined(graphQLError.extensions)) {
                scope.setExtra('extensions', graphQLError.extensions);
                if (isDefined(graphQLError.extensions.subCode)) {
                  fingerPrint.push(graphQLError.extensions.subCode as string);
                }
              }

              if (isDefined(operation.operationName)) {
                scope.setExtra('operation', operation.operationName);
                const genericOperationName = getGenericOperationName(
                  operation.operationName,
                );

                if (isDefined(genericOperationName)) {
                  fingerPrint.push(genericOperationName);
                }
              }

              if (!isEmpty(fingerPrint)) {
                scope.setFingerprint(fingerPrint);
              }

              captureException(error); // Sentry expects a JS error
            });
          })
          .catch((sentryError) => {
            // eslint-disable-next-line no-console
            console.error(
              'Failed to capture GraphQL error with Sentry:',
              sentryError,
            );
          });
      };

      const errorLink = onError(
        ({ graphQLErrors, networkError, forward, operation }) => {
          if (isDefined(graphQLErrors)) {
            onErrorCb?.(graphQLErrors);
            for (const graphQLError of graphQLErrors) {
              if (graphQLError.message === 'Unauthorized') {
                return handleTokenRenewal(operation, forward);
              }

              switch (graphQLError?.extensions?.code) {
                case 'APP_VERSION_MISMATCH': {
                  onAppVersionMismatch?.(
                    (graphQLError.extensions?.userFriendlyMessage as string) ||
                      t`Your app version is out of date. Please refresh the page.`,
                  );
                  return;
                }
                case 'UNAUTHENTICATED': {
                  return handleTokenRenewal(operation, forward);
                }
                case 'FORBIDDEN': {
                  return;
                }
                case 'USER_INPUT_ERROR': {
                  if (graphQLError.extensions?.isExpected === true) {
                    return;
                  }
                  sendToSentry({ graphQLError, operation });
                  return;
                }
                case 'INTERNAL_SERVER_ERROR': {
                  return; // already caught in BE
                }
                default:
                  sendToSentry({ graphQLError, operation });
              }
            }
          }

          if (isDefined(networkError)) {
            if (
              this.isRestOperation(operation) &&
              this.isAuthenticationError(networkError as ServerError)
            ) {
              return handleTokenRenewal(operation, forward);
            }

            if (isDebugMode === true) {
              // Network error debug info
            }
            onNetworkError?.(networkError);
          }
        },
      );

      return ApolloLink.from(
        [
          blockAuthQueriesLink, // 必須在最前面，攔截外部分享路由的認證查詢
          errorLink,
          authLink,
          ...(extraLinks || []),
          isDebugMode ? logger : null,
          retryLink,
          streamingRestLink,
          restLink,
          uploadLink,
        ].filter(isDefined),
      );
    };

    this.client = new ApolloClient({
      ...options,
      link: buildApolloLink(),
    });
  }

  private isRestOperation(operation: Operation): boolean {
    return operation.query.definitions.some(
      (def: DefinitionNode) =>
        def.kind === 'OperationDefinition' &&
        def.selectionSet?.selections.some(
          (selection: SelectionNode) =>
            selection.kind === 'Field' &&
            selection.directives?.some(
              (directive: DirectiveNode) =>
                directive.name.value === 'rest' ||
                directive.name.value === 'stream',
            ),
        ),
    );
  }

  private isAuthenticationError(error: ServerError): boolean {
    return error.statusCode === 401;
  }

  updateWorkspaceMember(workspaceMember: CurrentWorkspaceMember | null) {
    this.currentWorkspaceMember = workspaceMember;
  }

  updateCurrentWorkspace(workspace: CurrentWorkspace | null) {
    this.currentWorkspace = workspace;
  }

  updateAppVersion(appVersion?: string) {
    this.appVersion = appVersion;
  }

  getClient() {
    return this.client;
  }
}
