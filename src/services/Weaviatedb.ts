import weaviate, {
  BatchObjectsReturn,
  Collection,
  WeaviateClient,
  WeaviateReturn,
} from "weaviate-client";
import { config } from "dotenv";
import { WeaviateTextEmbeddingObject } from "../types/general_types";
import { v4 as uuidv4 } from "uuid";

config();

export default class WeaviateDB {
  static instance: WeaviateClient | null = null;

  static async getClientInstance(): Promise<WeaviateClient> {
    if (!this.instance) {
      const weaviateURL = process.env.WEAVIATE_URL as string;
      const weaviateKey = process.env.WEAVIATE_API_KEY_ADMIN as string;
      this.instance = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
      });
    }

    return this.instance;
  }

  static async createCollection(
    collectionName: string
  ): Promise<Collection<undefined, string> | null> {
    const client = await this.getClientInstance();

    try {
      const newCollection = await client?.collections.create({
        name: collectionName,
      });

      return newCollection;
    } catch (e) {
      throw new Error(
        "Error: Cannot create collection. Please enter a valid name"
      );
    }
  }

  static async checkIfCollectionExists(
    collectionName: string
  ): Promise<boolean> {
    const client = await this.getClientInstance();

    const doesExist = await client.collections.get(collectionName).exists();

    return doesExist;
  }

  static async insertOrUpdateObject(
    collectionName: string,
    data: { id: string; chunks: WeaviateTextEmbeddingObject[] }
  ): Promise<string | null> {
    try {
      const client = await this.getClientInstance();
      const collection = client.collections.get(collectionName);

      // Compute a representative vector (average of all chunk vectors)
      let representativeVector: number[] = [];
      if (data.chunks.length > 0) {
        const vectorLength = data.chunks[0].vector.length;
        representativeVector = new Array(vectorLength).fill(0);
        data.chunks.forEach((chunk) => {
          chunk.vector.forEach((val, i) => {
            representativeVector[i] += val;
          });
        });
        representativeVector = representativeVector.map(
          (v) => v / data.chunks.length
        );
      }

      if (await collection.data.exists(data.id)) {
        await collection.data.update({
          id: data.id, // Single document id
          properties: {
            chunks: data.chunks, // Array of chunks (each with text and vector)
          },
          vectors: representativeVector, // Representative vector for indexing
        });

        return data.id;
      }

      const result = await collection.data.insert({
        id: data.id, // Single document id
        properties: {
          chunks: data.chunks, // Array of chunks (each with text and vector)
        },
        vectors: representativeVector, // Representative vector for indexing
      });

      return result;
    } catch (e) {
      console.error("Error inserting data to Weaviate: ", e);
      return null;
    }
  }

  //   static async insertManyObjects(
  //     collectionName: string,
  //     data: WeaviateTextEmbeddingObject[],
  //     uniqueId: string = uuidv4()
  //   ): Promise<{
  //     id: string;
  //     result: BatchObjectsReturn<undefined> | null;
  //   } | null> {
  //     try {
  //       const client = await this.getClientInstance();

  //       const collection = client.collections.get(collectionName);

  //       const dataBuilder = data.map((item) => ({
  //         id: uniqueId,
  //         properties: { text: item.text },
  //         vector: item.vector,
  //       }));

  //       const result = await collection.data.insertMany(dataBuilder);

  //       return { id: uniqueId, result };
  //     } catch (e) {
  //       console.error("Error inserting data to weaviate: ", e);
  //       return null;
  //     }
  //   }

  static async getExistingData(collectionName: string, documentId: string) {
    try {
      const client = await this.getClientInstance();
      const collection = client.collections.get(collectionName);
      const data = await collection.query.fetchObjectById(documentId, {
        includeVector: true,
      });

      return data;
    } catch (e) {
      throw new Error(e as string);
    }
  }

  static async performNearVectorQuery(
    collectionName: string,
    documentId: string,
    questionEmbedding: WeaviateTextEmbeddingObject
  ): Promise<WeaviateReturn<undefined> | null> {
    try {
      const client = await this.getClientInstance();
      const collection = client.collections.get(collectionName);

      const result = await collection.query.nearVector(
        questionEmbedding.vector,
        {
          limit: 2,
          // certainty: 0.7,
          // distance: 12,
          // filters: {
          //   operator: "Equal",
          //   target: {
          //     property: "uuid",
          //   },
          //   value: documentId,
          // },
        }
      );

      return result;
    } catch (e) {
      console.log(e);
      throw new Error("Problem faced while performing vector query");
    }
  }
}
