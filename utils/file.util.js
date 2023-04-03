const crypto = require('crypto')
const { promisify } = require('util')
const { promises: fs, createReadStream } = require('fs')
const path = require('path')
const cron = require('node-cron');

const location = process.env.FOLDER ?? 'uploads'

const mainUtils = {
  uploadFile: async (file) => {
    try {
      const publicKey = crypto.randomBytes(16).toString('hex')
      const privateKey = crypto.randomBytes(16).toString('hex')

      const url = `${location}/${publicKey}-${privateKey}.${file.mimetype.split('/')[1]}`

      await promisify(file.mv)(url)

      return { publicKey, privateKey }
    } catch (err) {
      console.error(err);
      return false
    }
  },
  getFile: async (publicKey) => {
    try {
      const files = await fs.readdir(location)
      const fileFound = files.find((file) => file.includes(publicKey))

      if (!fileFound) {
        return res.status(404).json({ message: 'File not found' })
      }

      const fileStream = createReadStream(path.resolve(location, fileFound))

      return fileStream;
    } catch (err) {
      console.error(err);
      return false
    }
  },
  deleteFile: async (privateKey) => {
    try {
      const files = await fs.readdir(location)
      const fileFound = files.find((file) => file.includes(privateKey))
      await fs.unlink(path.resolve(location, fileFound));
      return true
    } catch (err) {
      console.error(err);
      return false
    }
  },
  cleanupInactiveFiles: async () => {

    // Clean up files that have not been accessed in 7 days every day at 1:00 AM
    const cutoffPeriod = process.env.CUTOFF_PERIOD || 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    cron.schedule('0 1 * * *', async () => {
      const folderPath = location;
      const cutoffDate = new Date(Date.now() - cutoffPeriod);
      try {
        const files = await fs.readdir(folderPath);
        for (const file of files) {
          const filePath = path.join(folderPath, file);
          try {
            const stats = await fs.stat(filePath);
            if (stats.isFile() && stats.atime < cutoffDate) {
              await fs.unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            }
          } catch (err) {
            console.warn(`Error processing file ${filePath}: ${err.message}`);
          }
        }
      } catch (err) {
        console.error(`Error reading folder ${folderPath}: ${err.message}`);
      }
    });
  }
}

module.exports = {
  fileUtils: mainUtils,
  location
}
