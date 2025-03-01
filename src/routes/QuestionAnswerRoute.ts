import { Request, Router } from "express";
import { CustomResponse } from "../constants/types";
import { upload } from "../middlewares/multer_upload";
import { QuestionAnswer } from "../services/QuestionAnswerModule";

const QuestionAnswerRouter = Router({
  caseSensitive: true,
});

QuestionAnswerRouter.post(
  "/qna",
  upload.none(),
  async (req: Request, res: CustomResponse): Promise<void> => {
    const { collection_name, document_id, question } = req.body;

    if (!collection_name || !document_id || !question) {
      res.status(400).json({
        message:
          "Required parameters collection name, document id or question is missing",
      });
      return;
    }

    try {
      const result = await QuestionAnswer.askQuestion(
        collection_name,
        document_id,
        question
      );

      res
        .status(200)
        .json({ message: "Question answered successfully", result });
      return;
    } catch (error) {
      res
        .status(500)
        .json({ message: "Problem faced with question answer. Server issue" });
      return;
    }
  }
);

export default QuestionAnswerRouter;
