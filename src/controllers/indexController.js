import logger from '../utils/logger.js'; // winston logger






export const index = (req, res, next) => {
  try {
    return res.render("index", { title: "Express" });
  } catch (error) {
    logger.error(`Error in index controller: ${error.message}`, error.stack);
    return next(error);
  }
};

export const time = (req, res, next) => {
  try {
    return res.render("time", { title: "Time" });
  } catch (error) {
    logger.error(`Error in time controller: ${error.message}`, error.stack);
    return next(error);
  }
};
