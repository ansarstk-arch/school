import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Compress image to target size (200KB) while maintaining quality
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save compressed image
 * @param {number} targetSizeKB - Target size in KB (default: 200)
 * @returns {Promise<string>} - Path to compressed image
 */
export const compressImage = async (inputPath, outputPath, targetSizeKB = 200) => {
  try {
    const targetSizeBytes = targetSizeKB * 1024;
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Start with high quality
    let quality = 90;
    let width = metadata.width;
    let height = metadata.height;
    
    // If image is too large, resize it first
    if (width > 800) {
      width = 800;
      height = Math.round((height * 800) / metadata.width);
    }
    
    let compressedBuffer;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      compressedBuffer = await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      
      // If size is acceptable, break
      if (compressedBuffer.length <= targetSizeBytes || quality <= 20) {
        break;
      }
      
      // Reduce quality for next attempt
      quality -= 10;
      attempts++;
      
      // If still too large after quality reduction, try reducing dimensions
      if (quality <= 30 && compressedBuffer.length > targetSizeBytes) {
        width = Math.round(width * 0.9);
        height = Math.round(height * 0.9);
        quality = 80; // Reset quality when reducing size
      }
      
    } while (attempts < maxAttempts);
    
    // Save compressed image
    await fs.promises.writeFile(outputPath, compressedBuffer);
    
    // Remove original file if different from output
    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      await fs.promises.unlink(inputPath);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('د انځور په کمپریس کولو کې تېروتنه');
  }
};

/**
 * Delete image file
 * @param {string} imagePath - Path to image file
 */
export const deleteImage = async (imagePath) => {
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

/**
 * Get full path for image
 * @param {string} filename - Image filename
 * @returns {string} - Full path to image
 */
export const getImagePath = (filename) => {
  if (!filename) return null;
  return path.join(process.cwd(), 'uploads', 'teachers', filename);
};

/**
 * Get image URL for frontend
 * @param {string} relativePath - Relative image path (e.g., "teachers/image.jpg" or "students/School/image.jpg")
 * @returns {string} - Image URL
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  // If path already starts with /, return as is
  if (relativePath.startsWith('/')) return relativePath;
  // Otherwise, prepend /uploads/
  return `/uploads/${relativePath}`;
};;