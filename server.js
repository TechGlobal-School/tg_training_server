import express from "express";
import "dotenv/config";
import studentsRouter from "./routes/students/index.js";
import instructorsRouter from "./routes/instructors/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./openapi.json" assert { type: "json" };
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
  customCss: ".swagger-ui .topbar {  display: none }", // remove navbar
};
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);

// Routes
app.use("/students", studentsRouter);
app.use("/instructors", instructorsRouter);

// Serve static files
app.use(express.static("public"));

// Listen
const PORT = process.env.PORT || 8089;
app.listen(PORT, () => `Server listening on port ${PORT}`);
