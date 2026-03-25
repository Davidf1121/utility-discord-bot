export function createLogger(module = 'App') {
  const levels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };
  
  const colors = {
    ERROR: '\x1b[31m',
    WARN: '\x1b[33m',
    INFO: '\x1b[36m',
    DEBUG: '\x1b[90m',
    RESET: '\x1b[0m'
  };
  
  return {
    error: (...args) => {
      console.log(`${colors.ERROR}[${module} ERROR]${colors.RESET}`, ...args);
    },
    warn: (...args) => {
      console.log(`${colors.WARN}[${module} WARN]${colors.RESET}`, ...args);
    },
    info: (...args) => {
      console.log(`${colors.INFO}[${module} INFO]${colors.RESET}`, ...args);
    },
    debug: (...args) => {
      if (process.env.DEBUG) {
        console.log(`${colors.DEBUG}[${module} DEBUG]${colors.RESET}`, ...args);
      }
    }
  };
}
