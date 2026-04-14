let logConfig = {
  showTimestamp: true,
  defaultLevel: 'INFO',
  modules: {},
  autoReloadLogLevel: 'INFO'
};

export function setLogConfig(config) {
  if (config && config.logging) {
    logConfig = { ...logConfig, ...config.logging };
    
    // If autoReloadLogLevel is set, use it for the AutoReload module if not explicitly overridden
    if (config.logging.autoReloadLogLevel && !logConfig.modules['AutoReload']) {
      logConfig.modules['AutoReload'] = config.logging.autoReloadLogLevel;
    }
  }
}

export function createLogger(moduleName = 'App', overrideConfig = null) {
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

  const getTimestamp = () => {
    const showTimestamp = overrideConfig?.showTimestamp ?? logConfig.showTimestamp;
    if (!showTimestamp) return '';
    return `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] `;
  };

  const shouldLog = (level) => {
    const levelValue = levels[level];
    
    let configLevel;
    if (overrideConfig) {
      configLevel = overrideConfig.modules?.[moduleName] || overrideConfig.defaultLevel;
    } else {
      configLevel = logConfig.modules[moduleName] || logConfig.defaultLevel;
    }
    
    const configLevelValue = levels[configLevel] ?? levels.INFO;
    
    // Special case for DEBUG: check process.env.DEBUG as well
    if (level === 'DEBUG' && process.env.DEBUG) return true;
    
    return levelValue <= configLevelValue;
  };
  
  return {
    error: (...args) => {
      if (shouldLog('ERROR')) {
        console.log(`${getTimestamp()}${colors.ERROR}[${moduleName} ERROR]${colors.RESET}`, ...args);
      }
    },
    warn: (...args) => {
      if (shouldLog('WARN')) {
        console.log(`${getTimestamp()}${colors.WARN}[${moduleName} WARN]${colors.RESET}`, ...args);
      }
    },
    info: (...args) => {
      if (shouldLog('INFO')) {
        console.log(`${getTimestamp()}${colors.INFO}[${moduleName} INFO]${colors.RESET}`, ...args);
      }
    },
    debug: (...args) => {
      if (shouldLog('DEBUG')) {
        console.log(`${getTimestamp()}${colors.DEBUG}[${moduleName} DEBUG]${colors.RESET}`, ...args);
      }
    }
  };
}
