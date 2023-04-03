const { promisify } = require('util')
const crypto = require('crypto')
const { promises: fs } = require('fs')
const path = require('path')

// Mock the dependencies
const file = {
  name: 'testfile.png',
  mimetype: 'image/png',
  mv: jest.fn()
}

// Mock the promisify function
jest.mock('util', () => ({
  promisify: jest.fn(fn => fn)
}))

// Delete


// Import the uploadFile function
const { uploadFile, getFile, deleteFile, } = require('../../utils/file.util').fileUtils

describe('File Utils', () => {
  describe('uploadFile', () => {
    it('should upload a file and return public and private keys', async () => {
      // Mock the crypto.randomBytes function
      jest.spyOn(crypto, 'randomBytes').mockReturnValueOnce(Buffer.from('mocked-public-key')).mockReturnValueOnce(Buffer.from('mocked-private-key'))

      // Call the uploadFile function
      const result = await uploadFile(file)

      // Verify that the file was moved to the correct URL
      expect(promisify).toHaveBeenCalledWith(file.mv)

      // Verify that the function returned the correct keys
      expect(result).toHaveProperty('privateKey')
      expect(result).toHaveProperty('publicKey')
    })

    it('should return false if an error occurs', async () => {
      // Mock the file.mv function to throw an error
      file.mv.mockImplementationOnce(() => { throw new Error('mocked error') })

      // Call the uploadFile function
      const result = await uploadFile(file)

      // Verify that the function returned false
      expect(result).toBe(false)
    })
  })

  describe('getFile', () => {
    it('should return a file stream when given a valid publicKey', async () => {
      await fs.writeFile('uploads/public-private.txt', 'Some Text', {
        encoding: 'utf-8',
      })
      const publicKey = 'public';
      const fileStream = await getFile(publicKey);
      expect(fileStream).toBeTruthy();
    });

    it('should return false when given an invalid publicKey', async () => {
      const publicKey = 'invalidpublickey';
      const fileStream = await getFile(publicKey);
      expect(fileStream).toBeFalsy();
    });
  });
})

