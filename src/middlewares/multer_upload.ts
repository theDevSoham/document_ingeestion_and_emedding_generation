import multer from "multer";
import path from "path";
import { acceptedFileTypes } from "../constants/file_constants";
import { Request } from "express";

// multer configuration
export const upload = multer({
    dest: "uploads/",
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!acceptedFileTypes.includes(ext)) {
            cb(null, false)
            return cb(new Error('Only DOCX, JSON, TXT, and PDF files are allowed'));
        }
        cb(null, true);
    },
    storage: multer.diskStorage({
        destination: './uploads',
        filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    })
})
// end of multer configuration