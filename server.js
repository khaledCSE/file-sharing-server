if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const { promises: fs, createReadStream } = require('fs');
const path = require('path');
const expressFileupload = require('express-fileupload');
const crypto = require('crypto')
const { promisify } = require('util');

const location = process.env.FOLDER ?? 'uploads'

async function main() {
  const app = express();

  await fs.mkdir(path.resolve(location), { recursive: true });

  app.use(express.static(path.resolve(__dirname, location)))

  app.use(expressFileupload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }))

  app.post('/files', async function (req, res) {
    const { file } = req.files
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No files received'
      })
    }

    const publicKey = crypto.randomBytes(16).toString('hex')
    const privateKey = crypto.randomBytes(16).toString('hex')

    const url = `${location}/${publicKey}-${privateKey}.${file.mimetype.split('/')[1]}`

    await promisify(file.mv)(url)

    res.json({ publicKey, privateKey })
  });

  app.get('/files/:publicKey', async function (req, res) {
    const publicKey = req.params.publicKey;
    const files = await fs.readdir(location)
    const fileFound = files.find((file) => file.includes(publicKey))

    if (!fileFound) {
      return res.status(404).json({ message: 'File not found' })
    }

    const fileStream = createReadStream(path.resolve(location, fileFound))

    fileStream.pipe(res)
  });

  app.delete('/files/:privateKey', async function (req, res) {
    const privateKey = req.params.privateKey;
    const files = await fs.readdir(location)
    const fileFound = files.find((file) => file.includes(privateKey))
    await fs.unlink(path.resolve(location, fileFound));
    res.json({
      message: 'File deleted'
    });
  });

  const port = process.env.PORT ?? 8000
  app.listen(port, function () {
    console.log('File Sharing API Server listening on port', port);
  });
}

main()