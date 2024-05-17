import express from "express";
import "dotenv/config";
import studentsRouter from "./routes/students/index.js";
import instructorsRouter from "./routes/instructors/index.js";
import editorRouter from "./routes/editor/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./openapi.json" assert { type: "json" };
// import cors from "cors";
import { swaggerOptions } from "./lib/swagger/index.js";
import serverless from "serverless-http";
import cors from "cors";

// App
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions)
);

// Routes
app.use("/students", studentsRouter);
app.use("/instructors", instructorsRouter);
app.use("/editor", editorRouter);

// Serve static files
app.use(express.static("public"));

// Serve serverless
export let handler = serverless(app);
