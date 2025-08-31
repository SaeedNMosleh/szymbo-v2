import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import dbConnect from "@/lib/dbConnect";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

export interface MediaMetadata {
  id: string;
  originalUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mediaType: "image" | "audio";
  storedAt: Date;
  storageMethod: "gridfs" | "local" | "cloud";
}

export interface StorageConfig {
  method: "gridfs" | "local" | "cloud";
  localPath?: string;
  cloudProvider?: "aws" | "azure";
  cloudConfig?: Record<string, unknown>;
}

/**
 * Comprehensive media storage service supporting multiple storage backends
 * Handles downloading temporary URLs and converting to permanent storage
 */
export class MediaStorageService {
  private config: StorageConfig;
  private gridFS: GridFSBucket | null = null;

  constructor(config?: StorageConfig) {
    this.config = config || {
      method: "gridfs", // Default to MongoDB GridFS for simplicity
      localPath: "./public/media",
    };
  }

  /**
   * Download and permanently store media from temporary URL
   */
  async storeMediaFromUrl(
    temporaryUrl: string,
    questionId: string,
    mediaType: "image" | "audio"
  ): Promise<MediaMetadata> {
    try {
      console.log(
        `📥 Downloading media for question ${questionId}:`,
        temporaryUrl
      );

      // Download the media file
      const mediaBuffer = await this.downloadMedia(temporaryUrl);
      const mimeType = await this.detectMimeType(mediaBuffer, temporaryUrl);
      const fileExtension = this.getFileExtension(mimeType, mediaType);

      // Generate unique filename
      const mediaId = uuidv4();
      const fileName = `${questionId}_${mediaId}${fileExtension}`;

      // Store using configured method and get permanent URL
      let permanentUrl: string;
      switch (this.config.method) {
        case "gridfs":
          permanentUrl = await this.storeInGridFS(
            mediaBuffer,
            fileName,
            mimeType
          );
          break;
        case "local":
          permanentUrl = await this.storeLocally(mediaBuffer, fileName);
          break;
        case "cloud":
          permanentUrl = await this.storeInCloud(
            mediaBuffer,
            fileName,
            mimeType
          );
          break;
        default:
          throw new Error(`Unsupported storage method: ${this.config.method}`);
      }

      const metadata: MediaMetadata = {
        id: mediaId,
        originalUrl: temporaryUrl,
        fileName,
        fileSize: mediaBuffer.length,
        mimeType,
        mediaType,
        storedAt: new Date(),
        storageMethod: this.config.method,
      };

      // Log successful storage with permanent URL
      console.log(`✅ Media stored: ${permanentUrl}`);

      console.log(
        `✅ Media stored successfully: ${fileName} (${mediaBuffer.length} bytes)`
      );
      return metadata;
    } catch (error) {
      console.error(
        `❌ Failed to store media for question ${questionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Download media from temporary URL with retry logic
   */
  private async downloadMedia(url: string): Promise<Buffer> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Downloading attempt ${attempt}/${maxRetries}:`, url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Szymbo-Media-Storage/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Validate file size (max 50MB)
        if (buffer.length > 50 * 1024 * 1024) {
          throw new Error(`File too large: ${buffer.length} bytes (max 50MB)`);
        }

        // Validate minimum file size (at least 1KB)
        if (buffer.length < 1024) {
          throw new Error(`File too small: ${buffer.length} bytes (min 1KB)`);
        }

        console.log(`✅ Downloaded ${buffer.length} bytes`);
        return buffer;
      } catch (error) {
        lastError = error as Error;
        console.error(`Download attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to download media after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Detect MIME type from buffer and URL
   */
  private async detectMimeType(buffer: Buffer, url: string): Promise<string> {
    // Check file signatures (magic numbers)
    const signatures: Record<string, string> = {
      "\xFF\xD8\xFF": "image/jpeg",
      "\x89PNG\r\n\x1a\n": "image/png",
      GIF8: "image/gif",
      WEBP: "image/webp",
      ID3: "audio/mp3",
      "\xFF\xFB": "audio/mp3",
      "\xFF\xF3": "audio/mp3",
      OggS: "audio/ogg",
      RIFF: "audio/wav", // Will need additional check for WAV vs AVI
    };

    const bufferStart = buffer.subarray(0, 12).toString("binary");

    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (bufferStart.startsWith(signature)) {
        return mimeType;
      }
    }

    // Special case for WAV files (RIFF format)
    if (
      bufferStart.startsWith("RIFF") &&
      buffer.subarray(8, 12).toString() === "WAVE"
    ) {
      return "audio/wav";
    }

    // Fallback to URL-based detection
    const urlLower = url.toLowerCase();
    if (urlLower.includes(".png")) return "image/png";
    if (urlLower.includes(".jpg") || urlLower.includes(".jpeg"))
      return "image/jpeg";
    if (urlLower.includes(".gif")) return "image/gif";
    if (urlLower.includes(".webp")) return "image/webp";
    if (urlLower.includes(".mp3")) return "audio/mp3";
    if (urlLower.includes(".wav")) return "audio/wav";
    if (urlLower.includes(".ogg")) return "audio/ogg";

    // Default fallback
    throw new Error("Unable to detect MIME type from buffer or URL");
  }

  /**
   * Get appropriate file extension for MIME type
   */
  private getFileExtension(
    mimeType: string,
    mediaType: "image" | "audio"
  ): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "audio/mp3": ".mp3",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
    };

    return extensions[mimeType] || (mediaType === "image" ? ".jpg" : ".mp3");
  }

  /**
   * Store media in MongoDB GridFS
   */
  private async storeInGridFS(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    try {
      await dbConnect();

      if (!this.gridFS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (global as any).mongoose.connection
          .client as MongoClient;
        const db = client.db();
        this.gridFS = new GridFSBucket(db, { bucketName: "media" });
      }

      return new Promise((resolve, reject) => {
        const uploadStream = this.gridFS!.openUploadStream(fileName, {
          metadata: {
            contentType: mimeType,
            uploadedAt: new Date(),
          },
        });

        uploadStream.on("finish", (file: { _id: ObjectId }) => {
          const permanentUrl = `/api/media/serve/${file._id.toString()}`;
          console.log(`✅ GridFS upload complete: ${permanentUrl}`);
          resolve(permanentUrl);
        });

        uploadStream.on("error", reject);
        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error("GridFS storage error:", error);
      throw error;
    }
  }

  /**
   * Store media locally in filesystem
   */
  private async storeLocally(
    buffer: Buffer,
    fileName: string
  ): Promise<string> {
    try {
      const localPath = this.config.localPath || "./public/media";

      // Ensure directory exists
      await fs.mkdir(localPath, { recursive: true });

      const filePath = path.join(localPath, fileName);
      await fs.writeFile(filePath, buffer);

      // Return URL relative to public directory
      const publicUrl = `/media/${fileName}`;
      return publicUrl;
    } catch (error) {
      console.error("Local storage error:", error);
      throw error;
    }
  }

  /**
   * Store media in cloud storage (placeholder for future implementation)
   *
   * @param buffer - The media file buffer to store
   * @param fileName - The name of the file
   * @param mimeType - The MIME type of the file
   * @returns Promise resolving to the permanent URL
   * @todo Implement cloud storage integration (AWS S3, Azure Blob Storage, etc.)
   */
  private async storeInCloud(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Log the parameters for future implementation reference
    console.log(
      `Cloud storage requested for file: ${fileName} (${mimeType}), size: ${buffer.length} bytes`
    );

    // This would integrate with AWS S3, Azure Blob Storage, etc.
    throw new Error(
      "Cloud storage not yet implemented. Please configure local or GridFS storage."
    );
  }

  /**
   * Check if URL is a temporary OpenAI image URL
   */
  static isTemporaryUrl(url: string): boolean {
    if (!url) return false;

    const temporaryDomains = [
      "oaidalleapiprodscus.blob.core.windows.net",
      "dall-e-images.s3.amazonaws.com",
      "openai-labs-public-images",
    ];

    return temporaryDomains.some((domain) => url.includes(domain));
  }

  /**
   * Process question media URLs during save-to-bank operation
   */
  async processQuestionMedia(questionData: {
    id: string;
    imageUrl?: string;
    audioUrl?: string;
  }): Promise<{
    imageUrl?: string;
    audioUrl?: string;
    mediaMetadata?: MediaMetadata[];
  }> {
    const mediaMetadata: MediaMetadata[] = [];
    let processedImageUrl = questionData.imageUrl;
    let processedAudioUrl = questionData.audioUrl;

    try {
      // Process image URL if it's temporary
      if (
        questionData.imageUrl &&
        MediaStorageService.isTemporaryUrl(questionData.imageUrl)
      ) {
        console.log(
          `🖼️ Processing temporary image for question ${questionData.id}`
        );
        const imageMetadata = await this.storeMediaFromUrl(
          questionData.imageUrl,
          questionData.id,
          "image"
        );
        processedImageUrl = `/api/media/serve/${imageMetadata.id}`;
        mediaMetadata.push(imageMetadata);
      }

      // Process audio URL if it's temporary
      if (
        questionData.audioUrl &&
        MediaStorageService.isTemporaryUrl(questionData.audioUrl)
      ) {
        console.log(
          `🔊 Processing temporary audio for question ${questionData.id}`
        );
        const audioMetadata = await this.storeMediaFromUrl(
          questionData.audioUrl,
          questionData.id,
          "audio"
        );
        processedAudioUrl = `/api/media/serve/${audioMetadata.id}`;
        mediaMetadata.push(audioMetadata);
      }

      return {
        imageUrl: processedImageUrl,
        audioUrl: processedAudioUrl,
        mediaMetadata: mediaMetadata.length > 0 ? mediaMetadata : undefined,
      };
    } catch (error) {
      console.error(
        `❌ Failed to process media for question ${questionData.id}:`,
        error
      );

      // Return original URLs as fallback (temporary URLs will expire, but question won't fail to save)
      console.warn(
        `⚠️ Falling back to original URLs for question ${questionData.id}`
      );
      return {
        imageUrl: questionData.imageUrl,
        audioUrl: questionData.audioUrl,
        mediaMetadata: mediaMetadata.length > 0 ? mediaMetadata : undefined,
      };
    }
  }

  /**
   * Retrieve media metadata by ID
   */
  async getMediaMetadata(mediaId: string): Promise<MediaMetadata | null> {
    // This would typically query a metadata collection
    // For now, we'll implement basic GridFS metadata retrieval
    try {
      await dbConnect();

      if (!this.gridFS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (global as any).mongoose.connection
          .client as MongoClient;
        const db = client.db();
        this.gridFS = new GridFSBucket(db, { bucketName: "media" });
      }

      const files = await this.gridFS
        .find({ _id: new ObjectId(mediaId) })
        .toArray();
      if (files.length === 0) return null;

      const file = files[0];
      return {
        id: file._id.toString(),
        originalUrl: file.metadata?.originalUrl || "",
        fileName: file.filename,
        fileSize: file.length,
        mimeType: file.metadata?.contentType || "application/octet-stream",
        mediaType: file.filename.includes("audio") ? "audio" : "image",
        storedAt: file.uploadDate,
        storageMethod: "gridfs",
      };
    } catch (error) {
      console.error("Error retrieving media metadata:", error);
      return null;
    }
  }
}
