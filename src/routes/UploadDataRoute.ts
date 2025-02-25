import { Request, Router } from "express";
import { upload } from "../middlewares/multer_upload";
import { CustomResponse } from "../constants/types";
import { DataIngestion } from "../helpers/DataIngestion";
import { getSentencesArrayFromFile } from "../helpers/functions";
import WeaviateDB from "../helpers/Weaviatedb";
import { TextEmbeddingObject } from "../types/general_types";

const UploadDataRouter = Router({
    caseSensitive: true,
})

UploadDataRouter.post('/upload_file', upload.single('unstructuredFile'), async (req: Request, res: CustomResponse): Promise<void> => {

    // upload file
    if (!req.file) {
        res.status(400).json({ message: "Please enter a file of required format" });
        return
    }

    if (!req.body.collection_name) {
        res.status(400).json({ message: "Please enter a valid collection name" });
        return
    }

    // break file into sentences and get embeddings from file
    const fileDetails = req.file;

    let fileSentences: string[] = [];
    let textEmbeddingsObject: TextEmbeddingObject[] | null = null;

    if (fileDetails?.path) {
        fileSentences = await getSentencesArrayFromFile(fileDetails?.path, fileDetails?.originalname);
    } else {
        res.status(400).json({ message: "Error: Path not found for file. Please re upload again" });
        return;
    }

    if (fileSentences.length > 0) {
        textEmbeddingsObject = await DataIngestion.getEmbeddingsFromTextArray(fileSentences);
    }

    // upload embeddings and text to weaviate db
    if (!textEmbeddingsObject) {
        res.status(500).json({ message: "Error: Text embedding object error" });
        return;
    }

    const receivedEmbeddings: TextEmbeddingObject[] = textEmbeddingsObject

    try {
        if (!(await WeaviateDB.checkIfCollectionExists(req.body.collection_name))) {

            await WeaviateDB.createCollection(req.body.collection_name);

        }

        const result = await WeaviateDB.insertManyObjects(req.body.collection_name, receivedEmbeddings.map(item => ({
            text: item.text,
            vector: item.embedding
        })))

        res.status(200).json({ message: "Embeddings storing successful", outcome: result });
        return
    } catch (e) {
        console.log("Error on weaviate instance: ", e)
        res.status(400).json({ message: "Error", error: "Error creating collection" });
        return;
    }
});

export default UploadDataRouter;