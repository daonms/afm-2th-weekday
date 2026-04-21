require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ImageKit = require('imagekit');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

app.use(cors());
app.use(express.static(path.join(__dirname)));

// POST /upload — 이미지 1장을 ImageKit에 업로드하고 URL 반환
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없습니다' });

  try {
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: '/afm-week6',
    });

    res.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (err) {
    console.error('ImageKit 업로드 오류:', err.message);
    res.status(500).json({ error: '업로드 실패: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중 → http://localhost:${PORT}`);
});
