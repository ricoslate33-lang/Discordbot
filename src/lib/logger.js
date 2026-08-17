const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT = process.env.LOG_LEVEL && LEVELS[process.env.LOG_LEVEL] !== undefined ? process.env.LOG_LEVEL : 'info';

function shouldLog(level) { return LEVELS[level] >= LEVELS[CURRENT]; }

function timestamp() { return new Date().toISOString(); }

export default {
  debug: (...args) => { if (shouldLog('debug')) console.debug('[DEBUG]', timestamp(), ...args); },
  info: (...args) => { if (shouldLog('info')) console.log('[INFO]', timestamp(), ...args); },
  warn: (...args) => { if (shouldLog('warn')) console.warn('[WARN]', timestamp(), ...args); },
  error: (...args) => { if (shouldLog('error')) console.error('[ERROR]', timestamp(), ...args); },
};