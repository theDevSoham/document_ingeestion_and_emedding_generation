import { Request, Router } from "express";
import { upload } from "../middlewares/multer_upload";
import { CustomResponse } from "../constants/types";
import { DataIngestion } from "../helpers/DataIngestion";
// import { getSentencesArrayFromFile } from "../helpers/functions";
import WeaviateDB from "../helpers/Weaviatedb";
import { TextEmbeddingObject } from "../types/general_types";
import { TextIngestionPipeline } from "../helpers/TextIngestionPipeline";

const UploadDataRouter = Router({
  caseSensitive: true,
});

UploadDataRouter.post(
  "/upload_file",
  upload.single("unstructuredFile"),
  async (req: Request, res: CustomResponse): Promise<void> => {
    // upload file
    if (!req.file) {
      res
        .status(400)
        .json({ message: "Please enter a file of required format" });
      return;
    }

    if (!req.file?.path) {
      res
        .status(400)
        .json({ message: "File path not set. Please Try re-uploading" });
      return;
    }

    if (!req.body.collection_name) {
      res.status(400).json({ message: "Please enter a valid collection name" });
      return;
    }

    try {
      // initiate text ingestion pipeline
      const textIngestionPipeline = new TextIngestionPipeline({
        fileDetails: req.file,
        collectionName: req.body.collection_name,
      });

      // break file into sentences and get embeddings from file
      await textIngestionPipeline.getDataFromFile();

      // generate the embeddings
      await textIngestionPipeline.generateEmeddingsFromText();

      // store in vector db
      const result = await textIngestionPipeline.storeEmeddingInVectorDb();

      res.status(200).json({
        message: "Successfully ingested data",
        result,
      });
    } catch (error) {
      res.status(500).json({ message: "Server Text ingestion error" });
    }
  }
);

UploadDataRouter.get(
  "/get_data_by_id/:id/:collection",
  async (req: Request, res: CustomResponse): Promise<void> => {
    if (!req.params.id || !req.params.collection) {
      res
        .status(400)
        .json({ message: "Please provide id and collection name" });
      return;
    }

    try {
      const data = await WeaviateDB.getExistingData(
        req.params.collection,
        req.params.id
      );

      res.status(200).json({ message: "Successfully retrieved data", data });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Error searching data", error: e });
    }
  }
);

UploadDataRouter.put(
  "/update_file",
  upload.single("unstructuredFile"),
  async (req: Request, res: CustomResponse): Promise<void> => {
    // upload file
    if (!req.file) {
      res
        .status(400)
        .json({ message: "Please enter a file of required format" });
      return;
    }

    if (!req.file?.path) {
      res
        .status(400)
        .json({ message: "File path not set. Please Try re-uploading" });
      return;
    }

    if (!req.body.collection_name) {
      res.status(400).json({ message: "Please enter a valid collection name" });
      return;
    }

    if (!req.body.document_id) {
      res
        .status(400)
        .json({ message: "Document Id is required to update document" });
      return;
    }

    try {
      // initiate text ingestion pipeline
      const textIngestionPipeline = new TextIngestionPipeline({
        fileDetails: req.file,
        collectionName: req.body.collection_name,
      });

      // break file into sentences and get embeddings from file
      await textIngestionPipeline.getDataFromFile();

      // generate the embeddings
      await textIngestionPipeline.generateEmeddingsFromText();

      // update in vector db
      const result = await textIngestionPipeline.updateEntry(
        req.body.document_id
      );

      res.status(200).json({
        message:
          "Successfully updated data of document " + req.body.document_id,
        result,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Server Text ingestion error for document " + req.body.document_id,
      });
    }
  }
);

export default UploadDataRouter;
