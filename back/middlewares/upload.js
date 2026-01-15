// back/middlewares/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    // 원본 확장자 추출
    const ext = path.extname(file.originalname).toLowerCase();
    // jfif를 jpg로 변환
    const finalExt = ext === '.jfif' ? '.jpg' : ext;
    cb(null, `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${finalExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('업로드 파일:', file.originalname, 'MIME:', file.mimetype);
  
  // MIME 타입 체크
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // 확장자 체크 (.jfif도 허용)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'];
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, gif, webp, jfif)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024  // 5MB
  }
});

module.exports = upload;