const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://expo.dev/artifacts/eas/AmFejtz23pViSwnt0Iln136tQSUB_1-rPx1DKW2SQFQ.tar.gz';
const dest = path.join('D:\\Repo\\thrivingskill.app', 'thrivingskill-v1.4.0-preview-ios.tar.gz');

console.log('Downloading iOS build artifact from EAS...');
console.log('Source:', url);
console.log('Destination:', dest);

const file = fs.createWriteStream(dest);

function download(curUrl) {
  https.get(curUrl, response => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      console.log('Following redirect to:', response.headers.location);
      download(response.headers.location);
      return;
    }

    if (response.statusCode !== 200) {
      console.error('Failed to download with status:', response.statusCode);
      process.exit(1);
    }

    const total = parseInt(response.headers['content-length'] || '0', 10);
    let downloaded = 0;

    response.on('data', chunk => {
      downloaded += chunk.length;
      if (total > 0 && downloaded % (5 * 1024 * 1024) < chunk.length) {
        console.log(`Progress: ${(downloaded / (1024 * 1024)).toFixed(1)} / ${(total / (1024 * 1024)).toFixed(1)} MB`);
      }
    });

    response.pipe(file);

    file.on('finish', () => {
      file.close(() => {
        const stats = fs.statSync(dest);
        console.log(`Download complete! File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      });
    });
  }).on('error', err => {
    fs.unlink(dest, () => {});
    console.error('Download error:', err.message);
    process.exit(1);
  });
}

download(url);
