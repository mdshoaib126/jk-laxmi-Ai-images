import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/env.js';

/**
 * Validate if the uploaded file is a valid image
 */
export async function validateImage(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Check if the image has valid dimensions
    if (!metadata.width || !metadata.height) {
      return false;
    }
    
    // Check minimum dimensions (to ensure quality)
    if (metadata.width < 200 || metadata.height < 200) {
      throw new Error('Image must be at least 200x200 pixels');
    }
    
    // Check maximum dimensions (to prevent huge files)
    if (metadata.width > 4000 || metadata.height > 4000) {
      throw new Error('Image must not exceed 4000x4000 pixels');
    }
    
    return true;
  } catch (error) {
    console.error('Image validation error:', error);
    return false;
  }
}

/**
 * Create a thumbnail version of the uploaded image
 */
export async function createThumbnail(imagePath, originalFilename) {
  try {
    const thumbnailDir = path.join(config.upload.uploadDir, 'thumbnails');
    
    // Ensure thumbnails directory exists
    try {
      await fs.access(thumbnailDir);
    } catch {
      await fs.mkdir(thumbnailDir, { recursive: true });
    }
    
    const thumbnailFilename = `thumb_${originalFilename}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    
    // Create thumbnail (300x300 max, maintaining aspect ratio)
    await sharp(imagePath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return null;
  }
}

/**
 * Save generated image data to the file system
 */
export async function saveGeneratedImage(imageData, filename) {
  try {
    // Ensure generated directory exists
    const generatedDir = config.upload.generatedDir;
    try {
      await fs.access(generatedDir);
    } catch {
      await fs.mkdir(generatedDir, { recursive: true });
    }
    
    const filePath = path.join(generatedDir, filename);
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(imageData, 'base64');
    await fs.writeFile(filePath, imageBuffer);
    
    // Optimize the saved image
    await optimizeImage(filePath);
    
    return filePath;
  } catch (error) {
    console.error('Save generated image error:', error);
    throw new Error('Failed to save generated image');
  }
}

/**
 * Optimize image for web delivery
 */
export async function optimizeImage(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Only optimize if image is large
    if (metadata.width > 1200 || metadata.height > 1200) {
      await sharp(imagePath)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toFile(`${imagePath}_optimized`);
      
      // Replace original with optimized version
      await fs.rename(`${imagePath}_optimized`, imagePath);
    }
    
    return imagePath;
  } catch (error) {
    console.error('Image optimization error:', error);
    // Don't throw error - optimization is optional
    return imagePath;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    };
  } catch (error) {
    console.error('Get image dimensions error:', error);
    return null;
  }
}

/**
 * Create a composite image showing before and after
 */
export async function createBeforeAfterImage(originalPath, generatedPath, outputPath) {
  try {
    const original = sharp(originalPath);
    const generated = sharp(generatedPath);
    
    // Get dimensions of both images
    const originalMeta = await original.metadata();
    const generatedMeta = await generated.metadata();
    
    // Calculate composite dimensions
    const maxHeight = Math.max(originalMeta.height, generatedMeta.height);
    const totalWidth = originalMeta.width + generatedMeta.width;
    
    // Create composite image
    await sharp({
      create: {
        width: totalWidth,
        height: maxHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: originalPath, left: 0, top: 0 },
      { input: generatedPath, left: originalMeta.width, top: 0 }
    ])
    .jpeg({ quality: 90 })
    .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Create before/after image error:', error);
    throw new Error('Failed to create before/after comparison image');
  }
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(inputPath, outputPath, format = 'jpeg', quality = 90) {
  try {
    let pipeline = sharp(inputPath);
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    await pipeline.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Image format conversion error:', error);
    throw new Error(`Failed to convert image to ${format}`);
  }
}

/**
 * Add watermark to image
 */
export async function addWatermark(imagePath, watermarkPath, outputPath, position = 'bottom-right') {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Resize watermark to be 10% of image width
    const watermarkWidth = Math.floor(metadata.width * 0.1);
    const watermark = await sharp(watermarkPath)
      .resize(watermarkWidth)
      .png()
      .toBuffer();
    
    // Calculate position
    let left, top;
    const watermarkMeta = await sharp(watermark).metadata();
    
    switch (position) {
      case 'bottom-right':
        left = metadata.width - watermarkMeta.width - 20;
        top = metadata.height - watermarkMeta.height - 20;
        break;
      case 'bottom-left':
        left = 20;
        top = metadata.height - watermarkMeta.height - 20;
        break;
      case 'top-right':
        left = metadata.width - watermarkMeta.width - 20;
        top = 20;
        break;
      case 'top-left':
        left = 20;
        top = 20;
        break;
      default:
        left = 20;
        top = 20;
    }
    
    await image
      .composite([{ input: watermark, left, top }])
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Add watermark error:', error);
    throw new Error('Failed to add watermark to image');
  }
}

/**
 * Clean up old files (for maintenance)
 */
export async function cleanupOldFiles(directory, maxAgeInDays = 30) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old files from ${directory}`);
    return deletedCount;
  } catch (error) {
    console.error('Cleanup old files error:', error);
    return 0;
  }
}