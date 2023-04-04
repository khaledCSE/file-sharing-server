
const { Storage } = require('@google-cloud/storage')

let googleStorage

// Google Storage Config
if (process.env.PROVIDER === 'google') {
  const configFile = process.env.CONFIG;
  if (!configFile) {
    throw new Error('Missing Google Cloud Storage configuration file');
  }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  googleStorage = new Storage({
    projectId: config.projectId,
    credentials: config.credentials,
  });
}

module.exports = googleStorage