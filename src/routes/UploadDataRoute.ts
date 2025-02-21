import { Request, Router } from "express";
import { upload } from "../middlewares/multer_upload";
import { CustomResponse } from "../constants/types";

const UploadDataRouter = Router({
    caseSensitive: true,
})

UploadDataRouter.post('/upload_file', upload.single('unstructuredFile'), async (req: Request, res: CustomResponse): Promise<void> => {

    if (!req.file) {
        res.status(400).json({ message: "Please enter a file of required format" });
        return
    }

    res.status(200).json({ message: "Hello" });
    return
})

export default UploadDataRouter;