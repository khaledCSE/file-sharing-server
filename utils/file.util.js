const crypto = require('crypto')
const { promisify } = require('util')
const { promises: fs, createReadStream } = require('fs')
const path = require('path')

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
}

module.exports = {
  fileUtils: mainUtils,
  location
}
