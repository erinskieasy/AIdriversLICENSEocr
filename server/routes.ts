import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { processImagesWithOpenAI } from "./openai-service";

// Extend the Express Request interface to support multer's req.files
// Note: We're not overriding the original definition, just adding a custom property
// that works for our specific use case of upload.array()
declare module "express-serve-static-core" {
  interface Request {
    files?: Express.Multer.File[];
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log(`[Routes-Multer] Checking file: ${file.originalname}, mimetype: ${file.mimetype}`);
    // Allow images only
    if (!file.mimetype.startsWith("image/")) {
      console.log(`[Routes-Multer] Rejected file ${file.originalname}: not an image`);
      return cb(new Error("Only image files are allowed"));
    }
    console.log(`[Routes-Multer] Accepted file ${file.originalname}`);
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("[Routes] Registering API routes");
  
  // Process images with OpenAI Assistant
  app.post(
    "/api/process-images",
    upload.array("files"),
    async (req, res) => {
      console.log("[Routes] Received request to /api/process-images");
      console.log(`[Routes] Request body keys: ${Object.keys(req.body).join(", ")}`);
      
      try {
        const files = req.files as Express.Multer.File[];
        console.log(`[Routes] Files received: ${files?.length || 0}`);
        if (files?.length) {
          files.forEach((file, index) => {
            console.log(`[Routes] File ${index + 1}: ${file.originalname}, ${file.size} bytes, ${file.mimetype}`);
          });
        }
        
        const apiKey = req.body.apiKey as string;
        const assistantId = req.body.assistantId as string;
        console.log(`[Routes] API Key provided: ${apiKey ? "Yes (masked)" : "No"}`);
        console.log(`[Routes] Assistant ID provided: ${assistantId ? "Yes" : "No"}`);

        if (!apiKey || !assistantId) {
          console.log("[Routes] Error: Missing API key or Assistant ID");
          return res.status(400).json({
            error: "API key and Assistant ID are required",
          });
        }

        if (!files || files.length === 0) {
          console.log("[Routes] Error: No files uploaded");
          return res.status(400).json({
            error: "No image files were uploaded",
          });
        }

        console.log("[Routes] Processing images with OpenAI...");
        const result = await processImagesWithOpenAI(
          apiKey,
          assistantId,
          files
        );

        console.log(`[Routes] Processing completed with ${result.error ? 'error' : 'success'}`);
        if (result.error) {
          console.log(`[Routes] Error from OpenAI service: ${result.error}`);
        } else {
          console.log(`[Routes] Response data received from OpenAI service`);
        }

        return res.status(200).json(result);
      } catch (error: any) {
        console.error("[Routes] Unexpected error processing images:", error);
        return res.status(500).json({
          error: error.message || "An error occurred while processing the images",
        });
      }
    }
  );

  console.log("[Routes] Creating HTTP server");
  const httpServer = createServer(app);
  console.log("[Routes] HTTP server created");

  return httpServer;
}
