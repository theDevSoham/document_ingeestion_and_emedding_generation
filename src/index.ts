import express, { NextFunction, Request } from "express";
import { config } from "dotenv";
import UploadDataRouter from "./routes/UploadDataRoute";
import { CustomResponse } from "./constants/types";
import QuestionAnswerRouter from "./routes/QuestionAnswerRoute";
import cors from "cors";

config();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// controllers
app.use("/api", UploadDataRouter);
app.use("/api", QuestionAnswerRouter);

app.use(
  async (
    error: Error,
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ): Promise<void> => {
    if (error) {
      console.error("Error thrown from server error handler: ", error);
      res
        .status(400)
        .json({ message: "Server handler error", error: error.message });
      return;
    }

    next();
  }
);

app.listen(port, (err) => {
  if (err) {
    return console.error("Error setting up listener: ", err.message);
  }
  console.log(`Server running on port ${port}`);
});
