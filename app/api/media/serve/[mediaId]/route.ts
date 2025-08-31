import { NextRequest, NextResponse } from "next/server";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import dbConnect from "@/lib/dbConnect";
import { MediaStorageService } from "@/lib/services/mediaStorageService";

/**
 * Serve media files from permanent storage with proper caching headers
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { mediaId } = await context.params;

    if (!mediaId) {
      return new NextResponse("Media ID is required", { status: 400 });
    }

    console.log(`📥 Serving media: ${mediaId}`);

    // Get media metadata
    const mediaStorage = new MediaStorageService();
    const metadata = await mediaStorage.getMediaMetadata(mediaId);

    if (!metadata) {
      console.error(`❌ Media not found: ${mediaId}`);
      return new NextResponse("Media not found", { status: 404 });
    }

    // Serve from GridFS (default storage method)
    const mediaBuffer = await serveFromGridFS(mediaId);
    const contentType = metadata.mimeType;

    // Set appropriate caching headers
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", mediaBuffer.length.toString());
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", `"${mediaId}"`);
    
    // Set Content-Disposition for browser handling
    const isImage = contentType.startsWith("image/");
    if (isImage) {
      headers.set("Content-Disposition", `inline; filename="${metadata.fileName}"`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${metadata.fileName}"`);
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === `"${mediaId}"`) {
      return new NextResponse(null, { status: 304, headers });
    }

    console.log(`✅ Serving ${metadata.mediaType}: ${metadata.fileName} (${mediaBuffer.length} bytes)`);

    return new NextResponse(mediaBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("❌ Error serving media:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/**
 * Serve media from MongoDB GridFS
 */
async function serveFromGridFS(mediaId: string): Promise<Buffer> {
  try {
    await dbConnect();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (global as any).mongoose.connection.client as MongoClient;
    const db = client.db();
    const gridFS = new GridFSBucket(db, { bucketName: "media" });

    // Convert string ID to ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(mediaId);
    } catch {
      throw new Error("Invalid media ID format");
    }

    // Stream file from GridFS
    const downloadStream = gridFS.openDownloadStream(objectId);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      downloadStream.on("error", (error) => {
        console.error("GridFS download error:", error);
        reject(new Error("Failed to retrieve media from GridFS"));
      });
    });

  } catch (error) {
    console.error("GridFS service error:", error);
    throw error;
  }
}

/**
 * HEAD request for metadata without content
 */
export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { mediaId } = await context.params;

    if (!mediaId) {
      return new NextResponse(null, { status: 400 });
    }

    // Get media metadata
    const mediaStorage = new MediaStorageService();
    const metadata = await mediaStorage.getMediaMetadata(mediaId);

    if (!metadata) {
      return new NextResponse(null, { status: 404 });
    }

    // Return headers without body
    const headers = new Headers();
    headers.set("Content-Type", metadata.mimeType);
    headers.set("Content-Length", metadata.fileSize.toString());
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", `"${mediaId}"`);

    return new NextResponse(null, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("❌ Error in HEAD request:", error);
    return new NextResponse(null, { status: 500 });
  }
}