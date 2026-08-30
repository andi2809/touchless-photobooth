import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const WASM_SRC = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const WASM_DEST = path.join(rootDir, 'public', 'wasm');
const MODEL_DEST_DIR = path.join(rootDir, 'public', 'models');
const MODEL_FILE = path.join(MODEL_DEST_DIR, 'hand_landmarker.task');
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[Offline Setup] Source directory does not exist: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function downloadFile(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`[Offline Setup] Model already exists at: ${dest}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`[Offline Setup] Downloading model from ${url} ...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('[Offline Setup] Preparing local MediaPipe WASM and AI models for offline usage...');
  copyDir(WASM_SRC, WASM_DEST);
  console.log('[Offline Setup] WASM assets copied to public/wasm');
  await downloadFile(MODEL_URL, MODEL_FILE);
  console.log('[Offline Setup] Model file ready at public/models/hand_landmarker.task');
}

main().catch(console.error);
