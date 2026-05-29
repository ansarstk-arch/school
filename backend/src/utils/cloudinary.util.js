import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import "dotenv/config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary with backend compression
 * @param {Buffer} fileBuffer - Image buffer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g., 'students', 'teachers', 'staff')
 * @param {string} options.publicId - Custom public ID (optional)
 * @param {number} options.quality - Image quality 1-100 (default: 80)
 * @param {number} options.maxWidth - Max width in pixels (default: 1200)
 * @param {number} options.maxHeight - Max height in pixels (default: 1200)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadImage = async (fileBuffer, options = {}) => {
  const {
    folder = "school",
    publicId,
    quality = 80,
    maxWidth = 1200,
    maxHeight = 1200,
  } = options;

  try {
    // Compress image using Sharp (backend compression)
    const compressedBuffer = await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          format: "jpg",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(compressedBuffer);
    });
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return filename.split(".")[0];
};

export default cloudinary;
