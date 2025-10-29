/* eslint-disable no-console */
export const logDebug = (message: any, ...optionalParams: any[]) => {
  if (process.env.IS_DEBUG_MODE === 'true') {
    console.debug(message, ...optionalParams);
  }
};
