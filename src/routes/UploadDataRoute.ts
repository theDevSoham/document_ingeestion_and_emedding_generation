import { Request, Router } from "express";
import { upload } from "../middlewares/multer_upload";
import { CustomResponse } from "../constants/types";
import { checkIfFilePresent } from "../middlewares/checkIfFilePresent";
import { DataIngestion } from "../helpers/DataIngestion";
import { getSentencesArrayFromFile } from "../helpers/functions";
import { FeatureExtractionOutput } from "@huggingface/inference";

const UploadDataRouter = Router({
    caseSensitive: true,
})

UploadDataRouter.post('/upload_file', upload.single('unstructuredFile'), async (req: Request, res: CustomResponse): Promise<void> => {

    if (!req.file) {
        res.status(400).json({ message: "Please enter a file of required format" });
        return
    }

    res.status(200).json({ message: "File upload successful", fileDetails: req.file });
    return
});

UploadDataRouter.post('/ingest_data', checkIfFilePresent, async (req: Request, res: CustomResponse): Promise<void> => {

    const fileDetails = req.file;
    let fileSentences: string[] = [];
    let embeddings: FeatureExtractionOutput | null = null;

    if (fileDetails?.path) {
        fileSentences = await getSentencesArrayFromFile(fileDetails?.path, fileDetails?.originalname);
    } else {
        res.status(400).json({ message: "Error: Path not found for file. Please re upload again" });
    }

    if (fileSentences.length > 0) {
        embeddings = await DataIngestion.getEmbeddingsFromTextArray(fileSentences);
    }

    res.status(200).json({ message: "File ingestion successful", embeddings });
    return
});

export default UploadDataRouter;