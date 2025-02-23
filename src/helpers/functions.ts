import fs from "fs";
import mammoth from "mammoth";
// import pdfParse from 'pdf-parse';
import path from "path"
import { PdfReader } from "pdfreader";

function splitIntoSentences(text: string): string[] {
    // Split the text where a sentence-ending punctuation (. ! or ?) is followed by one or more whitespace characters.
    const sentences = text.split(/(?<=[.!?])\s+/);
    // Trim each sentence and filter out any empty strings.
    return sentences.map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
}

export const getSentencesArrayFromFile = async (filePath: string, originalName: string): Promise<string[]> => {
    const extension = path.extname(originalName).toLowerCase();

    let rawText: string = "";

    switch (extension) {
        case ".docx":
            rawText = (await mammoth.extractRawText({
                path: filePath,
            })).value
            break;

        case ".pdf":
            const buffer = fs.readFileSync(filePath);
            // const pdfData = await pdfParse(buffer)

            new PdfReader().parseBuffer(buffer, (err, item) => {
                if (err) console.error("Error: ", err);
                else if (!item) console.warn("End of buffer");
                else if (item.text) rawText += item.text;
            })

            break;

        case ".txt":
            rawText = await fs.promises.readFile(filePath, "utf-8");
            break;

        case ".json":
            rawText = await fs.promises.readFile(filePath, 'utf-8');
            break;

        default:
            rawText = "Invalid file extension"
    }

    await fs.promises.unlink(filePath);
    console.log("Raw text: ", rawText);

    return splitIntoSentences(rawText);
}