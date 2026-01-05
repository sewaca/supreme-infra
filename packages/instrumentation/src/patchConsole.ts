// export enum SeverityText {
//   DEBUG = 'DEBUG',
//   INFO = 'INFO',
//   WARN = 'WARN',
//   ERROR = 'ERROR',
// }

// export const patchConsle = (
//   customLoggerEmit: (logRecord: LogRecord) => void,
// ) => {
//   const originalConsoleLog = console.log;
//   const originalConsoleError = console.error;
//   const originalConsoleWarn = console.warn;
//   const originalConsoleInfo = console.info;
//   const originalConsoleDebug = console.debug;

//   const getBody = (...args: unknown[]) =>
//     args
//       .map((arg) =>
//         typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
//       )
//       .join(' ');

//   console.log = (...args: unknown[]) => {
//     originalConsoleLog(...args);
//     customLoggerEmit({
//       severityNumber: SeverityNumber.INFO,
//       severityText: SeverityText.INFO,
//       body: getBody(args),
//     });
//   };

//   console.error = (...args: unknown[]) => {
//     originalConsoleError(...args);
//     customLoggerEmit({
//       severityNumber: SeverityNumber.ERROR,
//       severityText: SeverityText.ERROR,
//       body: getBody(args),
//     });
//   };

//   console.warn = (...args: unknown[]) => {
//     originalConsoleWarn(...args);
//     customLoggerEmit({
//       severityNumber: SeverityNumber.WARN,
//       severityText: SeverityText.WARN,
//       body: getBody(args),
//     });
//   };

//   console.info = (...args: unknown[]) => {
//     originalConsoleInfo(...args);
//     customLoggerEmit({
//       severityNumber: SeverityNumber.INFO,
//       severityText: SeverityText.INFO,
//       body: getBody(args),
//     });
//   };

//   console.debug = (...args: unknown[]) => {
//     originalConsoleDebug(...args);
//     customLoggerEmit({
//       severityNumber: SeverityNumber.DEBUG,
//       severityText: SeverityText.DEBUG,
//       body: getBody(args),
//     });
//   };
// };
