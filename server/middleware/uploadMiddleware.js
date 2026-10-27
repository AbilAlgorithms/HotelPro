const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Random server-generated filename: the client-supplied name is never used.
  filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
});

const fileFilter = (_req, file, cb) => {
  if (!EXT[file.mimetype]) {
    const err = new Error('Only JPEG, PNG or WebP images are allowed.');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024, files: 5 } });

// The declared MIME type is client-controlled, so also check the file's magic bytes.
function signatureOk(buf) {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return jpeg || png || webp;
}

function verifySignatures(req, res, next) {
  const files = req.files || [];
  for (const f of files) {
    const fd = fs.openSync(f.path, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (!signatureOk(buf)) {
      files.forEach((x) => fs.unlink(x.path, () => {}));
      return res.status(400).json({ message: 'One of the files is not a valid image.' });
    }
  }
  next();
}

module.exports = { uploadRoomImages: upload.array('photos', 5), verifySignatures, UPLOAD_DIR };
