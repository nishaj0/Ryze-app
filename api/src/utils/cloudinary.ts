import { v2 as cloudinary } from "cloudinary";
import { createLogger } from "./logger";

const log = createLogger("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  filename: string
): Promise<{ url: string; publicId: string }> => {
  const start = Date.now();
  log.debug({ folder, filename }, "cloudinary:upload:start");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ryze/${folder}`,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          log.error(
            { err: error, folder, filename, durationMs: Date.now() - start },
            "cloudinary:upload:fail"
          );
          return reject(error);
        }
        if (!result) {
          log.error({ folder, filename }, "cloudinary:upload:empty-result");
          return reject(new Error("Upload failed"));
        }
        log.debug(
          {
            folder,
            filename,
            publicId: result.public_id,
            durationMs: Date.now() - start,
          },
          "cloudinary:upload:ok"
        );
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  log.debug({ publicId }, "cloudinary:delete:start");
  try {
    await cloudinary.uploader.destroy(publicId);
    log.debug({ publicId }, "cloudinary:delete:ok");
  } catch (error) {
    log.error({ err: error, publicId }, "cloudinary:delete:fail");
    throw error;
  }
};

export default cloudinary;
