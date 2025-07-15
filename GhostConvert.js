// convert-images.js
// Node.js script to convert all PNG images to base64 and create a JSON file

const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = './images';  // Directory containing your 1.png, 2.png, etc.
const OUTPUT_FILE = './ghost-sprites.json';  // Output JSON file

// Ghost names array (same as in dashboard)
const ghostNames = [
  'Dash', 'Boo', 'Whisper', 'Phantom', 'Spook', 'Gloom', 'Shade', 'Vapor', 'Mist', 'Echo',
  'Wisp', 'Frost', 'Chill', 'Drifter', 'Banshee', 'Wraith', 'Spirit', 'Polter', 'Casper', 'Ghosty',
  'Smokey', 'Fang', 'Creepy', 'Hollow', 'Eerie', 'Spooky', 'Ghoul', 'Haunt', 'Lurker', 'Prowler',
  'Phantom', 'Spectre', 'Shimmer', 'Glitch', 'Flicker', 'Twitch', 'Bounce', 'Swirl', 'Ripple', 'Wobble',
  'Zippy', 'Spark', 'Flash', 'Zoom', 'Blur', 'Zap', 'Pop', 'Fizz', 'Buzz', 'Snap'
];

// Function to generate random HP between 2-14
const randomHP = () => Math.floor(Math.random() * 13) + 2;

// Convert image file to base64
function imageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

// Main conversion function
function convertImagesToJson() {
  console.log('🚀 Starting image conversion...');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    console.log('💡 Make sure your images are in the ./images/ directory');
    return;
  }

  const ghosts = [];
  const files = fs.readdirSync(IMAGES_DIR);
  
  // Sort files numerically (1.png, 2.png, ..., 50.png)
  const imageFiles = files
    .filter(file => /^\d+\.(png|jpg|jpeg)$/i.test(file))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)[1]);
      const numB = parseInt(b.match(/^(\d+)/)[1]);
      return numA - numB;
    });

  console.log(`📁 Found ${imageFiles.length} image files`);

  imageFiles.forEach((file, index) => {
    const ghostId = parseInt(file.match(/^(\d+)/)[1]);
    const filePath = path.join(IMAGES_DIR, file);
    
    console.log(`🔄 Converting ${file}...`);
    
    const base64Data = imageToBase64(filePath);
    if (base64Data) {
      const ghost = {
        id: ghostId,
        sprite: base64Data,
        name: ghostNames[ghostId - 1] || `Ghost ${ghostId}`,
        hp: ghostId === 1 ? 4 : randomHP(), // Keep Dash's original HP
        ability: ghostId === 1 ? 'Tinder' : '',
        rarity: 'Common'
      };
      
      ghosts.push(ghost);
      console.log(`✅ Converted ${file} -> Ghost #${ghostId} (${ghost.name})`);
    }
  });

  // Sort ghosts by ID
  ghosts.sort((a, b) => a.id - b.id);

  // Write to JSON file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(ghosts, null, 2));
    console.log(`\n🎉 Successfully created ${OUTPUT_FILE}`);
    console.log(`📊 Total ghosts: ${ghosts.length}`);
    console.log(`💾 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Also create a minified version
    const minifiedFile = OUTPUT_FILE.replace('.json', '.min.json');
    fs.writeFileSync(minifiedFile, JSON.stringify(ghosts));
    console.log(`🗜️  Minified version: ${minifiedFile}`);
    
  } catch (error) {
    console.error('❌ Error writing JSON file:', error.message);
  }
}

// Run the conversion
convertImagesToJson();

console.log('\n📝 Next steps:');
console.log('1. Upload ghost-sprites.json to your GitHub repo');
console.log('2. Update your dashboard to load from this JSON file');
console.log('3. All your ghost images will be embedded as base64!');