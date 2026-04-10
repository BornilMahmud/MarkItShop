const path = require('path');

async function uploadMainImage(req, res) {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.uploadedFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const uploadedFile = req.files.uploadedFile;
  const safeBaseName = `${Date.now()}-${uploadedFile.name}`.replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicDir = path.resolve(__dirname, '..', '..', 'public');
  const targetPath = path.join(publicDir, safeBaseName);

  uploadedFile.mv(targetPath, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to upload file', details: err.message });
    }

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileName: safeBaseName,
      filePath: `/${safeBaseName}`,
    });
  });
}

  module.exports = {
    uploadMainImage
};