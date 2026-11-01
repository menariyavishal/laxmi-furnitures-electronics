/**
 * Supabase Storage Integration
 *
 * Handles file uploads and deletions for booking design photos and attachments.
 * Uses native fetch with Supabase Storage REST API (zero extra runtime dependencies).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pueggvcwhpxoxyltjxqt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "temp-images";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload an image (Buffer or Uint8Array) to Supabase Storage
 * Folder structure: bookings/{bookingNumber}/{timestamp}_{sanitizedFileName}
 */
export async function uploadBookingDesign(
  bookingNumber: string,
  fileName: string,
  fileBuffer: Buffer | Uint8Array,
  mimeType: string = "image/jpeg"
): Promise<UploadResult> {
  if (!SUPABASE_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is not configured in environment variables");
  }

  const cleanBookingNum = bookingNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filePath = `bookings/${cleanBookingNum}/${Date.now()}_${sanitizedFileName}`;

  const uploadEndpoint = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: fileBuffer as any,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to upload to Supabase (${res.status}): ${errorText}`);
  }

  const publicUrl = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

  return {
    path: filePath,
    publicUrl,
  };
}

/**
 * Delete a list of file paths from Supabase Storage
 */
export async function deleteStorageFiles(filePaths: string[]): Promise<boolean> {
  if (!SUPABASE_KEY || filePaths.length === 0) return true;

  try {
    const deleteEndpoint = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${BUCKET_NAME}`;

    const res = await fetch(deleteEndpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: filePaths }),
    });

    return res.ok;
  } catch (err) {
    console.error("Error deleting files from Supabase Storage:", err);
    return false;
  }
}

/**
 * Delete all images associated with a specific booking folder
 */
export async function deleteBookingFolder(bookingNumber: string): Promise<boolean> {
  if (!SUPABASE_KEY) return true;

  try {
    const cleanBookingNum = bookingNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
    const prefix = `bookings/${cleanBookingNum}`;

    // List objects in booking folder first
    const listEndpoint = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/list/${BUCKET_NAME}`;
    const listRes = await fetch(listEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix,
        limit: 100,
      }),
    });

    if (!listRes.ok) return false;
    const items = await listRes.json();
    if (!Array.isArray(items) || items.length === 0) return true;

    const pathsToDelete = items.map((item: any) => `${prefix}/${item.name}`);
    return await deleteStorageFiles(pathsToDelete);
  } catch (err) {
    console.error("Failed to delete booking folder from Supabase:", err);
    return false;
  }
}

