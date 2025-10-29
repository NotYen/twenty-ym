/* eslint-disable no-console */
export const logInfo = (message: any, ...optionalParams: any[]) => {
  if (process.env.IS_DEBUG_MODE === 'true') {
    console.log(message, ...optionalParams);
  }
};
