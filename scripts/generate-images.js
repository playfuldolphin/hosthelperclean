// Image Generation Script
// This creates simple SVG placeholders for missing images
// For production, replace with actual branded images

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../images');

// Helper to create SVG
function createSVG(width, height, content, bgColor = '#3182ce') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  ${content}
</svg>`;
}

// PWA Icons
const icon192 = createSVG(192, 192, `
  <circle cx="96" cy="96" r="70" fill="#ffffff" opacity="0.2"/>
  <text x="96" y="110" font-family="Arial, sans-serif" font-size="100" fill="white" text-anchor="middle">🧹</text>
`);

const icon512 = createSVG(512, 512, `
  <circle cx="256" cy="256" r="200" fill="#ffffff" opacity="0.2"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="280" fill="white" text-anchor="middle">🧹</text>
`);

// Logo
const logo = createSVG(200, 60, `
  <text x="30" y="35" font-family="Arial, sans-serif" font-size="40" fill="white" font-weight="bold">🧹</text>
  <text x="70" y="40" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">Host Helper</text>
`);

// OG Image (social media)
const ogImage = createSVG(1200, 630, `
  <rect width="1200" height="630" fill="linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)"/>
  <text x="600" y="250" font-family="Arial, sans-serif" font-size="72" fill="white" text-anchor="middle" font-weight="bold">Host Helper Clean</text>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" opacity="0.9">Never Worry About Turnover Cleaning Again</text>
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle">✨ Photo Verification • 📋 Smart Checklists • ⭐ Quality Guarantee</text>
`, 'linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)');

// Twitter Card
const twitterCard = createSVG(1200, 600, `
  <text x="600" y="240" font-family="Arial, sans-serif" font-size="64" fill="white" text-anchor="middle" font-weight="bold">Host Helper Clean</text>
  <text x="600" y="330" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">Cleaning Management for Rental Properties</text>
  <text x="600" y="420" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Trusted by 2,500+ Airbnb & VRBO Hosts</text>
`);

// Avatar placeholder
const avatar = createSVG(200, 200, `
  <circle cx="100" cy="100" r="90" fill="#e2e8f0"/>
  <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" fill="#64748b" text-anchor="middle">👤</text>
`, '#f7fafc');

// Integration logos (simple placeholders)
const vrboLogo = createSVG(160, 60, `
  <rect width="160" height="60" fill="#ffffff" rx="8"/>
  <text x="80" y="38" font-family="Arial, sans-serif" font-size="28" fill="#003580" text-anchor="middle" font-weight="bold">VRBO</text>
`, '#ffffff');

const bookingLogo = createSVG(160, 60, `
  <rect width="160" height="60" fill="#003580" rx="8"/>
  <text x="80" y="30" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">Booking.com</text>
`, '#003580');

const stripeLogo = createSVG(160, 60, `
  <rect width="160" height="60" fill="#635bff" rx="8"/>
  <text x="80" y="38" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" font-weight="bold">stripe</text>
`, '#635bff');

// Screenshots (simple mockups)
const screenshot1 = createSVG(400, 800, `
  <rect width="400" height="800" fill="#f7fafc"/>
  <rect width="400" height="60" fill="#3182ce"/>
  <text x="200" y="40" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" font-weight="bold">Host Helper</text>
  
  <rect x="20" y="80" width="360" height="140" fill="white" rx="12" stroke="#e2e8f0" stroke-width="2"/>
  <text x="40" y="120" font-family="Arial, sans-serif" font-size="18" fill="#2d3748" font-weight="bold">Dashboard</text>
  <text x="40" y="150" font-family="Arial, sans-serif" font-size="14" fill="#718096">Upcoming Cleanings: 5</text>
  <text x="40" y="180" font-family="Arial, sans-serif" font-size="14" fill="#718096">Active Properties: 3</text>
  <text x="40" y="210" font-family="Arial, sans-serif" font-size="14" fill="#718096">This Month: $1,250</text>
`, '#f7fafc');

const screenshot2 = createSVG(400, 800, `
  <rect width="400" height="800" fill="#f7fafc"/>
  <rect width="400" height="60" fill="#3182ce"/>
  <text x="200" y="40" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" font-weight="bold">Cleaning Checklist</text>
  
  <rect x="20" y="80" width="360" height="60" fill="white" rx="8" stroke="#e2e8f0" stroke-width="2"/>
  <text x="40" y="115" font-family="Arial, sans-serif" font-size="16" fill="#2d3748">✓ Kitchen cleaned</text>
  
  <rect x="20" y="150" width="360" height="60" fill="white" rx="8" stroke="#e2e8f0" stroke-width="2"/>
  <text x="40" y="185" font-family="Arial, sans-serif" font-size="16" fill="#2d3748">✓ Bathroom sanitized</text>
  
  <rect x="20" y="220" width="360" height="60" fill="white" rx="8" stroke="#e2e8f0" stroke-width="2"/>
  <text x="40" y="255" font-family="Arial, sans-serif" font-size="16" fill="#2d3748">□ Bedroom tidied</text>
`, '#f7fafc');

// Shortcut icons
const newCleaningIcon = createSVG(96, 96, `
  <rect width="96" height="96" fill="#10b981" rx="20"/>
  <text x="48" y="65" font-family="Arial, sans-serif" font-size="50" fill="white" text-anchor="middle">+</text>
`, '#10b981');

const todayIcon = createSVG(96, 96, `
  <rect width="96" height="96" fill="#f59e0b" rx="20"/>
  <text x="48" y="62" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle">📅</text>
`, '#f59e0b');

// Write all files
const files = {
  'icon-192.svg': icon192,
  'icon-512.svg': icon512,
  'logo.svg': logo,
  'og-image.svg': ogImage,
  'twitter-card.svg': twitterCard,
  'avatar.svg': avatar,
  'vrbo-logo.svg': vrboLogo,
  'booking-logo.svg': bookingLogo,
  'stripe-logo.svg': stripeLogo,
  'screenshot1.svg': screenshot1,
  'screenshot2.svg': screenshot2,
  'new-cleaning.svg': newCleaningIcon,
  'today.svg': todayIcon
};

console.log('🎨 Generating placeholder images...\n');

Object.entries(files).forEach(([filename, content]) => {
  const filepath = path.join(imagesDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`✅ Created: ${filename}`);
});

console.log('\n✨ All placeholder images generated!');
console.log('\n📝 Note: These are SVG placeholders.');
console.log('   For production, replace with actual branded PNG/JPG images.');
console.log('\n💡 To convert SVG to PNG, you can use:');
console.log('   - Online: https://cloudconvert.com/svg-to-png');
console.log('   - CLI: npm install -g sharp-cli && sharp input.svg -o output.png');

module.exports = { createSVG, files };
