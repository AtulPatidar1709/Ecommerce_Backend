import multer from 'multer';
import path from 'path';

//for disk storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../../public/data/uploads')); // folder where files will be saved
    
//   }
// });

// Store files in memory instead of disk
const storage = multer.memoryStorage();

const upload = multer({ storage });

// For multiple images and one thumbnail
export const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },    // multiple images
  { name: 'thumbnail', maxCount: 1 }  // single thumbnail
]);