import { NextFunction, Request, Express } from "express";
import fs from 'fs'
import path from "path";
import { CustomResponse } from "../constants/types";

function isExpressMulterFile(fileDetails: any): fileDetails is Express.Multer.File {
    if (!fileDetails || typeof fileDetails !== "object") return false;

    // Check for basic properties common to all Multer file objects
    const hasBasicProps =
        typeof fileDetails.fieldname === "string" &&
        typeof fileDetails.originalname === "string" &&
        typeof fileDetails.encoding === "string" &&
        typeof fileDetails.mimetype === "string" &&
        typeof fileDetails.size === "number";

    if (!hasBasicProps) return false;

    // For disk storage, check for destination, filename, and path properties
    const isDiskStorage =
        typeof fileDetails.destination === "string" &&
        typeof fileDetails.filename === "string" &&
        typeof fileDetails.path === "string";

    // For memory storage, check if a buffer is provided
    const isMemoryStorage = "buffer" in fileDetails && Buffer.isBuffer(fileDetails.buffer);

    return isDiskStorage || isMemoryStorage;
}

export const checkIfFilePresent = async (req: Request, res: CustomResponse, next: NextFunction): Promise<void> => {
    const { fileDetails } = req.body

    if (!isExpressMulterFile(fileDetails)) {
        res.status(400).json({ message: "File path doesn't exist" })
        return
    }

    req.file = fileDetails

    // if file exists then push it to req.file as Express.Multer.File
    next();
}