const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Check if Cloudinary config is present
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let upload;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'nirmal-handloom',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        },
    });

    upload = multer({ storage: storage });
} else {
    console.warn('⚠️ Cloudinary not configured. Image uploads will fail. Please check .env file.');
    // Fallback or dummy middleware that throws specific error if used
    upload = multer({
        storage: multer.memoryStorage(), // Use memory storage just to not crash on init
        fileFilter: (req, file, cb) => {
            cb(new Error('Cloudinary not configured properly in .env'), false);
        }
    });
}

module.exports = { cloudinary, upload };
