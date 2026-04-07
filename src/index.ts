import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { apiHandler } from "./routes/api";

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://frontend-load-log.vercel.app",
  "https://loadlog-api.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

const openapiDocument = YAML.load(path.join(__dirname, "openapi", "openapi.yaml"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(apiHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
