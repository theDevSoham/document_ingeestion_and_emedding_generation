import weaviate, { BatchObjectsReturn, Collection, WeaviateClient } from 'weaviate-client';
import { config } from "dotenv";

config();

export default class WeaviateDB {
    static instance: WeaviateClient | null = null;

    static async getClientInstance(): Promise<WeaviateClient> {

        if (!this.instance) {

            const weaviateURL = process.env.WEAVIATE_URL as string;
            const weaviateKey = process.env.WEAVIATE_API_KEY_ADMIN as string;
            this.instance = await weaviate.connectToWeaviateCloud(weaviateURL, {
                authCredentials: new weaviate.ApiKey(weaviateKey),
            }
            )
        }

        return this.instance;
    }

    static async createCollection(collectionName: string): Promise<Collection<undefined, string>> {
        const client = await this.getClientInstance();

        const newCollection = await client?.collections.create({
            name: collectionName,
        })

        return newCollection;
    }

    static async checkIfCollectionExists(collectionName: string): Promise<boolean> {
        const client = await this.getClientInstance();

        const doesExist = await (client.collections.get(collectionName)).exists();

        return doesExist;
    }

    static async insertObject(collectionName: string, data: { text: string[], vector: number[] }): Promise<string | null> {
        try {
            const client = await this.getClientInstance();

            const collection = client.collections.get(collectionName);

            const result = await collection.data.insert({
                properties: {
                    text: data.text,
                },
                vectors: data.vector,
            })

            return result;
        } catch (e) {
            console.error("Error inserting data to weaviate: ", e);
            return null;
        }
    }

    static async insertManyObjects(collectionName: string, data: { text: string, vector: number[] }[]): Promise<BatchObjectsReturn<undefined> | null> {
        try {
            const client = await this.getClientInstance();

            const collection = client.collections.get(collectionName);

            const dataBuilder = data.map(item => ({
                properties: { text: item.text },
                vector: item.vector
            }))

            const result = await collection.data.insertMany(dataBuilder);

            return result;
        } catch (e) {
            console.error("Error inserting data to weaviate: ", e);
            return null;
        }
    }
}