import { WeaviateReturn } from "weaviate-client";
import { WeaviateTextEmbeddingObject } from "../types/general_types";
import { DataIngestion } from "./DataIngestion";
import WeaviateDB from "./Weaviatedb";

export class QuestionAnswer {
  static async askQuestion(
    collectionName: string,
    documentId: string,
    question: string
  ): Promise<WeaviateReturn<undefined>> {
    const embedding = await DataIngestion.getEmbeddingsFromTextArray([
      question,
    ]);
    const embeddingObject: WeaviateTextEmbeddingObject = {
      ...embedding[0],
      vector: embedding[0].embedding as number[],
    };
    const qnaResult = await WeaviateDB.performNearVectorQuery(
      collectionName,
      documentId,
      embeddingObject
    );

    return qnaResult as WeaviateReturn<undefined>;
  }
}
