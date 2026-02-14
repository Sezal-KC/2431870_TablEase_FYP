const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // save files to uploads folder
  },
  filename: function (req, file, cb) {
    // Rename file: menuitem-TIMESTAMP.EXT
    cb(null, 'menuitem-' + Date.now() + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  
  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

// Init upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // max 20 mb
});

module.exports = upload;
