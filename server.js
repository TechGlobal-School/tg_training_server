import express from "express";
import "dotenv/config";
import studentsRouter from "./routes/students/index.js";
import instructorsRouter from "./routes/instructors/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./openapi.json" assert { type: "json" };
import winston from "winston";
import cors from "cors";

// Init
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (request, response, next) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  response.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
// Swagger
const options = {
  swaggerOptions: {
    validatorUrl: null,
  },
  customCss: ".swagger-ui .topbar { display: none }",
};
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);
// Logger - testing out. Check AWS logs
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    // new winston.transports.File({ filename: "error.log", level: "error" }),
    // new winston.transports.File({ filename: "combined.log" }),
  ],
});
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Serve static files
app.use(express.static("public"));

// Routes
app.use("/students", studentsRouter);
app.use("/instructors", instructorsRouter);

// Listen
const PORT = process.env.PORT || 8089;
app.listen(PORT, () => `Server listening on port ${PORT}`);
