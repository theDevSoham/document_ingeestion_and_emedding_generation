import express, { NextFunction, Request, Response } from 'express';
import { config } from "dotenv";

// static manipulations
config();
interface CustomResponse extends Response<{ message: string, [key: string]: any }> { }
// end of static manipulation


const port = process.env.PORT || 3000

const app = express();

app.post('/upload', async (req: Request, res: CustomResponse): Promise<void> => {
    res.status(200).json({ message: "Hello" });
    return
})

app.use(async (error: Error, req: Request, res: CustomResponse, next: NextFunction): Promise<void> => {
    if (error) {
        res.status(500).json({ message: "Server Error", error });
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
