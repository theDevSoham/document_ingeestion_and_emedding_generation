import { Request, Router } from "express";
import { upload } from "../middlewares/multer_upload";
import { CustomResponse } from "../constants/types";
import { checkIfFilePresent } from "../middlewares/checkIfFilePresent";
import { DataIngestion } from "../helpers/DataIngestion";
import { getSentencesArrayFromFile } from "../helpers/functions";
import WeaviateDB from "../helpers/Weaviatedb";

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
    let textEmbeddingsObject: { text: string, embedding: number | number[] | number[][] }[] | null = null;

    if (fileDetails?.path) {
        fileSentences = await getSentencesArrayFromFile(fileDetails?.path, fileDetails?.originalname);
    } else {
        res.status(400).json({ message: "Error: Path not found for file. Please re upload again" });
    }

    if (fileSentences.length > 0) {
        textEmbeddingsObject = await DataIngestion.getEmbeddingsFromTextArray(fileSentences);
    }

    res.status(200).json({ message: "File ingestion successful", embeddings: textEmbeddingsObject });
    return
});

UploadDataRouter.post('/store_data', async (req: Request, res: CustomResponse): Promise<void> => {

    if (!req.body.embeddings || !req.body.collectionName) {
        res.status(400).json({ message: "Error: expected embeddings data, text aray and collection name to be passed in body" });
        return;
    }

    const receivedEmbeddings: { text: string, embedding: number[] }[] = req.body.embeddings

    if (!(await WeaviateDB.checkIfCollectionExists(req.body.collectionName))) {
        await WeaviateDB.createCollection(req.body.collectionName);
    }

    const result = await WeaviateDB.insertManyObjects(req.body.collectionName, receivedEmbeddings.map(item => ({
        text: item.text,
        vector: item.embedding
    })))

    res.status(200).json({ message: "Embeddings storing successful", outcome: result });
})

export default UploadDataRouter;