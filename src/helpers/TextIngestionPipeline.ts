import mammoth from "mammoth";
import { TextIngestionConstructor } from "../types/text_ingestion_pipeline";
import path from "path";
import fs from "fs";
import { PdfReader } from "pdfreader";
import { TextEmbeddingObject } from "../types/general_types";
import { DataIngestion } from "./DataIngestion";
import WeaviateDB from "./Weaviatedb";
import { BatchObjectsReturn } from "weaviate-client";

export class TextIngestionPipeline {
  private fileDetails: Express.Multer.File;
  private collectionName: string;
  private rawText: string;
  private textEmbeddingsObject: TextEmbeddingObject[];

  constructor(data: TextIngestionConstructor) {
    this.fileDetails = data.fileDetails;
    this.collectionName = data.collectionName;
    this.rawText = "";
    this.textEmbeddingsObject = [];
  }

  /**
   * Splits a string into smaller chunks of a specified size with optional overlap.
   *
   * @param text - The input string to be chunked.
   * @param chunkSize - The desired length for each chunk.
   * @param overlap - (Optional) The number of characters that each chunk should overlap with the previous one. Default is 0.
   * @returns An array of string chunks.
   */
  private static chunkText(
    text: string,
    chunkSize: number,
    overlap: number = 0
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    // Ensure the overlap is less than the chunk size
    if (overlap >= chunkSize) {
      throw new Error("Overlap must be smaller than chunkSize.");
    }

    while (start < text.length) {
      const end = start + chunkSize;
      const chunk = text.substring(start, Math.min(end, text.length));
      chunks.push(chunk);
      // Advance start by the non-overlapping length
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Extracts data from files
   *
   * @performs The data extracted
   */
  async getDataFromFile(): Promise<void> {
    if (this.fileDetails) {
      const extension = path
        .extname(this.fileDetails.originalname)
        .toLowerCase();

      switch (extension) {
        case ".docx":
          this.rawText = (
            await mammoth.extractRawText({
              path: this.fileDetails.path,
            })
          ).value;
          break;

        case ".pdf":
          const buffer = fs.readFileSync(this.fileDetails.path);
          // const pdfData = await pdfParse(buffer)

          new PdfReader().parseBuffer(buffer, (err, item) => {
            if (err) console.error("Error: ", err);
            else if (!item) console.warn("End of buffer");
            else if (item.text) this.rawText += item.text;
          });

          break;

        case ".txt":
          this.rawText = await fs.promises.readFile(
            this.fileDetails.path,
            "utf-8"
          );
          break;

        case ".json":
          this.rawText = await fs.promises.readFile(
            this.fileDetails.path,
            "utf-8"
          );
          break;

        default:
          this.rawText = "";
          throw new Error("Invalid file format");
      }

      await fs.promises.unlink(this.fileDetails.path);
    } else {
      throw new Error("Error: File is not set");
    }
  }

  /**
   * Extracts data from files
   *
   * @performs The embedding generated from raw data.
   */
  async generateEmeddingsFromText(): Promise<void> {
    if (this.rawText.length > 0) {
      this.textEmbeddingsObject =
        await DataIngestion.getEmbeddingsFromTextArray(
          TextIngestionPipeline.chunkText(this.rawText, 20, 5)
        );
    } else {
      throw new Error("Error: Text length is zero");
    }
  }

  /**
   * Extracts data from files
   *
   * @performs Stores the data
   */
  async storeEmeddingInVectorDb(): Promise<BatchObjectsReturn<undefined> | null> {
    try {
      if (!(await WeaviateDB.checkIfCollectionExists(this.collectionName))) {
        await WeaviateDB.createCollection(this.collectionName);
      }

      const result = await WeaviateDB.insertManyObjects(
        this.collectionName,
        this.textEmbeddingsObject.map((item) => ({
          text: item.text,
          vector: item.embedding,
        }))
      );

      return result;
    } catch (e) {
      console.log("Error on weaviate instance: ", e);
      throw new Error("Error: " + e);
    }
  }

  /**
   * Updates data
   *
   * @performs data update with change in data
   */
  async updateEntry(documentId: string) {}
}
