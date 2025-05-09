import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { processImagesWithOpenAI } from "./openai-service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Process images with OpenAI Assistant
  app.post(
    "/api/process-images",
    upload.array("files"),
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        const apiKey = req.body.apiKey as string;
        const assistantId = req.body.assistantId as string;

        if (!apiKey || !assistantId) {
          return res.status(400).json({
            error: "API key and Assistant ID are required",
          });
        }

        if (!files || files.length === 0) {
          return res.status(400).json({
            error: "No image files were uploaded",
          });
        }

        const result = await processImagesWithOpenAI(
          apiKey,
          assistantId,
          files
        );

        return res.status(200).json(result);
      } catch (error: any) {
        console.error("Error processing images:", error);
        return res.status(500).json({
          error: error.message || "An error occurred while processing the images",
        });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
