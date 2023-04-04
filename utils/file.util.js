const crypto = require('crypto')
const { promisify } = require('util')
const { promises: fs, createReadStream } = require('fs')
const path = require('path')
const cron = require('node-cron');
const googleStorage = '../config/google.config.js'

const location = process.env.FOLDER ?? 'uploads'

const mainUtils = {
  uploadFile: async (file, storageType = 'local') => {
    try {
      const publicKey = crypto.randomBytes(16).toString('hex')
      const privateKey = crypto.randomBytes(16).toString('hex')

      if (storageType === 'local') {
        const url = `${location}/${publicKey}-${privateKey}.${file.mimetype.split('/')[1]}`
        await promisify(file.mv)(url)
      } else {
        const bucket = googleStorage.bucket(config.bucketName);
        const file = bucket.file(name);
        const privateKey = generatePrivateKey();
        const publicKey = generatePublicKey(name, privateKey);
        await file.save(buffer, {
          resumable: false,
          metadata: {
            contentType: 'application/octet-stream',
            metadata: {
              publicKey,
              privateKey,
            },
          },
        });
      }
      return { publicKey, privateKey }
    } catch (err) {
      console.error(err);
      return false
    }
  },
  getFile: async (publicKey, storageType = 'local') => {
    try {
      if (storageType === 'local') {
        const files = await fs.readdir(location)
        const fileFound = files.find((file) => file.includes(publicKey))

        if (!fileFound) {
          return false
        }

        const fileStream = createReadStream(path.resolve(location, fileFound))
        return fileStream;
      } else {
        const [files] = await googleStorage.bucket(config.bucketName).getFiles({
          metadata: {
            publicKey
          }
        })
        const [file] = files
        const fileStream = file.createReadStream();
        return fileStream
      }
    } catch (err) {
      console.error(err);
      return false
    }
  },
  deleteFile: async (privateKey, storageType = 'local') => {
    try {
      if (storageType === 'local') {
        const files = await fs.readdir(location)
        const fileFound = files.find((file) => file.includes(privateKey))
        await fs.unlink(path.resolve(location, fileFound));
        return true
      } else {
        // Use Google Cloud Storage
        const [files] = await googleStorage.bucket(bucketName).getFiles({
          metadata: {
            publicKey
          }
        })
        const [file] = files
        await file.delete();
      }
    } catch (err) {
      console.error(err);
      return false
    }
  },
  cleanupInactiveFiles: async () => {

    // Clean up files that have not been accessed in 7 days every day at 1:00 AM
    const cutoffPeriod = process.env.CUTOFF_PERIOD || 30 * 24 * 60 * 60 * 1000; // Default to 30 days
    const job = cron.schedule('0 1 * * *', async (storageType = 'local') => {
      if (storageType === 'local') {
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
      } else {
        // Use Google Cloud
        try {
          const [files] = await googleStorage.bucket(config.bucketName).getFiles();

          for (const file of files) {
            const [metadata] = await file.getMetadata();

            // Check if file is inactive for more than 30 days
            const lastUpdated = new Date(metadata.updated);
            const daysSinceLastUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
            if (daysSinceLastUpdate >= 30) {
              const privateKey = metadata.privateKey;

              // Delete the file
              await file.delete();
              console.log(`File ${privateKey} deleted.`);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    });

    return job
  }
}

module.exports = {
  fileUtils: mainUtils,
  location
}
