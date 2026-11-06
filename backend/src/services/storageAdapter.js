const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/resources');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Storage Adapter for Learning Resources
 * Stores files on local disk rather than MongoDB, returning a static public URL.
 */
class StorageAdapter {
  /**
   * Save a base64 encoded or buffer file to disk
   * @param {Object} fileData { originalName, base64Content, mimeType }
   * @returns {Object} { fileUrl, fileSize, fileType }
   */
  async saveFile({ originalName, base64Content, mimeType }) {
    if (!originalName || !base64Content) {
      throw new Error('File name and file content are required');
    }

    // Clean up base64 header if present (e.g. "data:application/pdf;base64,...")
    const cleanBase64 = base64Content.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    await fs.promises.writeFile(filePath, buffer);

    const sizeInKb = (buffer.length / 1024).toFixed(1);
    const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    return {
      fileUrl: `/uploads/resources/${uniqueFileName}`,
      fileSize: sizeStr,
      fileType: mimeType || 'application/octet-stream',
    };
  }

  /**
   * Delete a file from disk
   */
  async deleteFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/resources/')) return;
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn('[StorageAdapter] Failed to delete file:', err.message);
    }
  }

  /**
   * Create a sample study material text/PDF file for seeding
   */
  async createSampleResourceFile(filename, content) {
    try {
      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.promises.writeFile(filePath, content, 'utf8');
      return `/uploads/resources/${filename}`;
    } catch (err) {
      console.warn('[StorageAdapter] Sample file creation warning:', err.message);
      return `/uploads/resources/${filename}`;
    }
  }
}

module.exports = new StorageAdapter();
