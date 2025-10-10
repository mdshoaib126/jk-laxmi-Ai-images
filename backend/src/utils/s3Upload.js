import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload image file to S3
 * @param {string} filePath - Local file path
 * @param {string} originalName - Original filename
 * @param {string} folder - S3 folder (uploads/generated/thumbnails)
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadImageToS3(filePath, originalName, folder = 'uploads') {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Optimize image with Sharp
    let optimizedBuffer = await sharp(fileBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize({ width: 2048, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // If file is still larger than 2MB, reduce quality further
    if (optimizedBuffer.length > 2 * 1024 * 1024) {
      optimizedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
    }

    // Generate S3 key
    const timestamp = Date.now();
    const ext = path.extname(originalName) || '.jpg';
    const filename = `${timestamp}${ext}`;
    const folderName = process.env.MY_AWS_FOLDER_NAME || '';
    const key = folderName 
      ? `${folderName}/${folder}/${filename}` 
      : `${folder}/${filename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
    });

    await s3.send(command);

    // Generate URL
    const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

    return { key, url: fileUrl };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Upload base64 image data to S3
 * @param {string} base64Data - Base64 image data (with or without data URL prefix)
 * @param {string} filename - Desired filename
 * @param {string} folder - S3 folder (uploads/generated/thumbnails)
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadBase64ToS3(base64Data, filename, folder = 'uploads') {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    // Optimize image with Sharp
    let optimizedBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 2048, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // If file is still larger than 2MB, reduce quality further
    if (optimizedBuffer.length > 2 * 1024 * 1024) {
      optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
    }

    // Generate S3 key
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}.jpg`;
    const folderName = process.env.MY_AWS_FOLDER_NAME || '';
    const key = folderName 
      ? `${folderName}/${folder}/${finalFilename}` 
      : `${folder}/${finalFilename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
    });

    await s3.send(command);

    // Generate URL
    const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

    return { key, url: fileUrl };
  } catch (error) {
    console.error('S3 base64 upload error:', error);
    throw new Error(`S3 base64 upload failed: ${error.message}`);
  }
}

/**
 * Create thumbnail and upload to S3
 * @param {string} sourceFilePath - Source image file path
 * @param {string} originalName - Original filename
 * @returns {Promise<{key: string, url: string}>}
 */
export async function createThumbnailAndUpload(sourceFilePath, originalName) {
  try {
    // Read source file
    const fileBuffer = fs.readFileSync(sourceFilePath);
    
    // Create thumbnail (300x300 max, maintain aspect ratio)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize({ width: 300, height: 300, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generate S3 key for thumbnail
    const timestamp = Date.now();
    const ext = path.extname(originalName) || '.jpg';
    const filename = `thumb_${timestamp}${ext}`;
    const folderName = process.env.MY_AWS_FOLDER_NAME || '';
    const key = folderName 
      ? `${folderName}/thumbnails/${filename}` 
      : `thumbnails/${filename}`;

    // Upload thumbnail to S3
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_S3_BUCKET,
      Key: key,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
    });

    await s3.send(command);

    // Generate URL
    const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

    return { key, url: fileUrl };
  } catch (error) {
    console.error('Thumbnail S3 upload error:', error);
    throw new Error(`Thumbnail S3 upload failed: ${error.message}`);
  }
}

/**
 * Save generated image (base64) to S3
 * @param {string} base64Data - Base64 image data from AI generation
 * @param {string} filename - Desired filename
 * @returns {Promise<{key: string, url: string, fileSize: number, width: number, height: number}>}
 */
export async function saveGeneratedImageToS3(base64Data, filename) {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Optimize image with Sharp
    let optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(optimizedBuffer).metadata();

    // Generate S3 key
    const timestamp = Date.now();
    const finalFilename = filename || `generated_${timestamp}.jpg`;
    const folderName = process.env.MY_AWS_FOLDER_NAME || '';
    const key = folderName 
      ? `${folderName}/generated/${finalFilename}` 
      : `generated/${finalFilename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
    });

    await s3.send(command);

    // Generate URL
    const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

    return { 
      key, 
      url: fileUrl,
      fileSize: optimizedBuffer.length,
      width: metadata.width || null,
      height: metadata.height || null
    };
  } catch (error) {
    console.error('Generated image S3 upload error:', error);
    throw new Error(`Generated image S3 upload failed: ${error.message}`);
  }
}

export default {
  uploadImageToS3,
  uploadBase64ToS3,
  createThumbnailAndUpload,
  saveGeneratedImageToS3
};