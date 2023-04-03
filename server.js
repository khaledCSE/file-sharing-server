if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const { promises: fs } = require('fs');
const path = require('path');
const expressFileupload = require('express-fileupload');
const { fileUtils, location } = require('./utils/file.util');

const { uploadLimiter, downloadLimiter } = require('./utils/limit.util');

async function main() {
  const app = express();

  // Cleanup Inactive Files
  fileUtils.cleanupInactiveFiles()

  await fs.mkdir(path.resolve(location), { recursive: true });

  app.use(express.static(path.resolve(__dirname, location)))

  app.use(expressFileupload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  }))

  app.post('/files', uploadLimiter, async function (req, res) {
    const { file } = req.files
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No files received'
      })
    }

    const fileKeys = await fileUtils.uploadFile(file)

    if (!fileKeys) {
      return res.status(500).json({
        success: false,
        message: 'Error Uploading File',
      })
    }

    res.status(201).json({
      success: true,
      data: fileKeys
    })
  });

  app.get('/files/:publicKey', downloadLimiter, async function (req, res) {
    const publicKey = req.params.publicKey;

    const fileToSend = await fileUtils.getFile(publicKey)

    if (!fileToSend) {
      return res.status(404).json({
        success: false,
        message: 'File Not Found'
      })
    }

    fileToSend.pipe(res)
  });

  app.delete('/files/:privateKey', async function (req, res) {
    const privateKey = req.params.privateKey;

    const fileDeleted = await fileUtils.deleteFile(privateKey)

    if (!fileDeleted) {
      return res.status(500).json({
        success: false,
        message: 'Error Deleting File'
      })
    }

    res.json({
      success: true,
      message: 'File Deleted'
    });
  });

  const port = process.env.PORT ?? 8000
  app.listen(port, function () {
    console.log('File Sharing API Server listening on port', port);
  });
}

main()