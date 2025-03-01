import { HfInference } from "@huggingface/inference";
import { config } from "dotenv";

config();

export class DataIngestion {
  private static hf: HfInference | null = null;
  private static model: string =
    "sentence-transformers/distilbert-base-nli-mean-tokens";
  private static accessToken: string = process.env.HF_API_KEY as string;

  static getInstance(): HfInference {
    if (this.hf === null) {
      this.hf = new HfInference(this.accessToken);
    }

    const hfInferenceInstance: HfInference = this.hf;
    return hfInferenceInstance;
  }

  /**
   * @param text
   * @returns precomputed embedded version of the text
   */
  static async getEmbeddingsFromTextArray(
    text: string[]
  ): Promise<{ text: string; embedding: number | number[] | number[][] }[]> {
    const instance = this.getInstance();

    const embeddings = await instance.featureExtraction({
      model: this.model,
      inputs: text,
    });

    const resultObject: {
      text: string;
      embedding: number | number[] | number[][];
    }[] = [];

    embeddings.forEach((embedding, index) => {
      resultObject.push({
        text: text[index],
        embedding,
      });
    });

    return resultObject;
  }
}
