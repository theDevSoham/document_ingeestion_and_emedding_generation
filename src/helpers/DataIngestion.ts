import { FeatureExtractionOutput, HfInference } from '@huggingface/inference';

export class DataIngestion {
    private static hf: HfInference | null = null
    private static model: string = "sentence-transformers/distilbert-base-nli-mean-tokens"
    private static accessToken: string = process.env.HUGGINGFACE_ACCESS_TOKEN as string

    static getInstance(): HfInference {
        if (this.hf === null) {
            this.hf = new HfInference(this.accessToken)
        }

        const hfInferenceInstance: HfInference = this.hf;
        return hfInferenceInstance
    }

    static async getEmbeddingsFromTextArray(text: string[]): Promise<FeatureExtractionOutput> {
        const instance = this.getInstance();

        const embeddings = await instance.featureExtraction({
            model: this.model,
            inputs: text,
        })

        return embeddings;
    }
}