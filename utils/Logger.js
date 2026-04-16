import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'bot.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

function writeToFile(moduleName, level, args) {
  try {
    const timestamp = new Date().toISOString();
    const cleanArgs = args.map(a => {
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          );
        } catch (e) {
          return '[Complex Object]';
        }
      }
      return String(a);
    }).join(' ');

    const logEntry = `[${timestamp}] [${moduleName} ${level}] ${cleanArgs}\n`;

    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.old');
    }

    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

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
        writeToFile(moduleName, 'ERROR', args);
      }
    },
    warn: (...args) => {
      if (shouldLog('WARN')) {
        console.log(`${getTimestamp()}${colors.WARN}[${moduleName} WARN]${colors.RESET}`, ...args);
        writeToFile(moduleName, 'WARN', args);
      }
    },
    info: (...args) => {
      if (shouldLog('INFO')) {
        console.log(`${getTimestamp()}${colors.INFO}[${moduleName} INFO]${colors.RESET}`, ...args);
        writeToFile(moduleName, 'INFO', args);
      }
    },
    debug: (...args) => {
      if (shouldLog('DEBUG')) {
        console.log(`${getTimestamp()}${colors.DEBUG}[${moduleName} DEBUG]${colors.RESET}`, ...args);
        writeToFile(moduleName, 'DEBUG', args);
      }
    }
  };
}
