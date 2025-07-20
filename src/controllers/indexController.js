const controller = {};

controller.index = (req, res, next) => {
  try {
    
    return res.render("index", { title: "Express" });
      
  } catch (error) {
    console.error(`Error in index controller: ${error.message}`, error.stack);
    return next(error);
  }
};


controller.index = (req, res, next) => {
  try {
    return res.render("time", { title: "Express" });
  } catch (error) {
    console.error(`Error in index controller: ${error.message}`, error.stack);
    return next(error);
  }
};

controller.time = (req, res, next) => {
  try {
    return res.render("time", { title: "Time" });
  } catch (error) {
    console.error(`Error in time controller: ${error.message}`, error.stack);
    return next(error);
  }
};

export default controller;
