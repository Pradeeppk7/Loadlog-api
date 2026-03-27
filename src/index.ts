import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { apiHandler } from "./routes/api";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openapiDocument = YAML.load(path.join(__dirname, "openapi", "openapi.yaml"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(apiHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});