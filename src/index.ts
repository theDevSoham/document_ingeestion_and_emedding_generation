import express, { NextFunction, Request, Response } from 'express';
import { config } from "dotenv";
import UploadDataRouter from './routes/UploadDataRoute';
import { CustomResponse } from './constants/types';

config();
const port = process.env.PORT || 3000
const app = express();
app.use(express.json());

// controllers
app.use('/upload', UploadDataRouter)

app.use(async (error: Error, req: Request, res: CustomResponse, next: NextFunction): Promise<void> => {
    if (error) {
        console.error("Error thrown from server error handler: ", error);
        res.status(400).json({ message: "Server handler error", error: error.message });
        return;
    }

    next();
})

app.listen(port, (err) => {
    if (err) {
        return console.error('Error setting up listener: ', err.message)
    }
    console.log(`Server running on port ${port}`);
})
