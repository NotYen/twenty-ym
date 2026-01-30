/* eslint-disable no-console */

/**
 * Debug log 工具
 * 只在 IS_DEBUG_MODE=true 時輸出，AWS 環境不會印出
 *
 * 使用方式：
 * import { logDebug } from 'src/utils/logDebug';
 * logDebug('Debug message', { data: 'value' });
 */
export const logDebug = (message: any, ...optionalParams: any[]) => {
  if (process.env.IS_DEBUG_MODE === 'true') {
    console.debug(message, ...optionalParams);
  }
};

/**
 * Warning log 工具
 * 只在 IS_DEBUG_MODE=true 時輸出
 */
export const logWarn = (message: any, ...optionalParams: any[]) => {
  if (process.env.IS_DEBUG_MODE === 'true') {
    console.warn(message, ...optionalParams);
  }
};

/**
 * Error log 工具
 * 只在 IS_DEBUG_MODE=true 時輸出
 */
export const logError = (message: any, ...optionalParams: any[]) => {
  if (process.env.IS_DEBUG_MODE === 'true') {
    console.error(message, ...optionalParams);
  }
};
