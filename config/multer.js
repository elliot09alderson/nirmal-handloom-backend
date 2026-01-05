const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Engine Selection
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    // Use Cloudinary Storage
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'nirmal-handloom', // Folder name in Cloudinary
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Resize large images
        }
    });
} else {
    // Fallback to Disk Storage (Local)
    console.warn('Cloudinary credentials missing. Falling back to local disk storage.');
    storage = multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });
}

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|webp|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = upload;
