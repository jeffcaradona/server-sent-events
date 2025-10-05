/**
 * Creates a registry for lifecycle hooks (startup, shutdown, etc.).
 * @param {string} name - Registry name for logging/debugging.
 * @returns {Object} { register, runAll }
 */
export function createHookRegistry(name = 'hook') {
  const hooks = [];

  /**
   * Registers a hook function.
   * @param {Function} fn - Function to run during lifecycle event.
   */
  function register(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError(`${name} must be a function`);
    }
    hooks.push(fn);
  }

  /**
   * Runs all registered hooks in sequence.
   * @param {Object} [logger] - Optional logger for error reporting.
   * @returns {Promise<void>}
   */
  async function runAll(logger) {
    for (const fn of hooks) {
      try {
        await fn();
      } catch (err) {
        if (logger && typeof logger.error === 'function') {
          logger.error(`[${name}] error: ${err.message}`, { error: err });
        }
      }
    }
  }

  return { register, runAll };
}