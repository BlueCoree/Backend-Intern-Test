const errorHandler = (err, _req, res, _next) => {
  console.error(`[${err.name}] ${err.message}`);

  switch (err.name) {
    case "NotFound":
      res.status(404).json({
        status: "Error",
        message: err.message
      });
      break;

    case "BadRequest":
      res.status(400).json({
        status: "Error",
        message: err.message
      });
      break;

    case "DatabaseError":
      res.status(500).json({
        status: "Error",
        message: err.message
      });
      break;

    default:
      res.status(500).json({
        status: "Error",
        message: err.message || "Internal Server Error"
      });
      break;
  }
};

module.exports = errorHandler;
