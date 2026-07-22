const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getUvCommand() {
  try {
    execSync('uv --version', { stdio: 'ignore' });
    return 'uv';
  } catch (e) {
    return 'python -m uv';
  }
}

function cleanAndBuild() {
  try {
    console.log('Cleaning dist directory...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist');

    console.log('Building Tailwind CSS...');
    execSync('npx tailwindcss -i ./src/index.css -o ./dist/index.css --minify', { stdio: 'inherit' });

    console.log('Building HTML files...');
    const uvCmd = getUvCommand();
    execSync(`${uvCmd} run python src/build.py --output dist --no-clean`, { stdio: 'inherit' });

    console.log('Copying static assets...');
    const publicDir = 'public';
    if (fs.existsSync(publicDir)) {
      const entries = fs.readdirSync(publicDir);
      for (const entry of entries) {
        const srcPath = path.join(publicDir, entry);
        const destPath = path.join('dist', entry);
        fs.cpSync(srcPath, destPath, { recursive: true });
      }
    }

    console.log('Optimizing images...');
    const optScript = path.join('src', 'optimize_images.py');
    if (fs.existsSync(optScript)) {
      execSync(`${uvCmd} run python src/optimize_images.py`, { stdio: 'inherit' });
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

cleanAndBuild();
