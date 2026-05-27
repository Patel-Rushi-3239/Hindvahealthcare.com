const fs = require('fs');

let data = JSON.parse(fs.readFileSync('generated_map.json', 'utf8'));

// 1. Write the new SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500">
  <path d="${data.svgPath}" fill="#c2d0df" stroke="#ffffff" stroke-width="0.5"/>
</svg>`;
fs.writeFileSync('world-map.svg', svgContent, 'utf8');

// 2. Update hindva.js with new coordinates
let hindva = fs.readFileSync('../js/hindva.js', 'utf8');

// Find the countries array
const startMarker = 'var countries = [';
const endMarker = '];';
const startIdx = hindva.indexOf(startMarker);
const endIdx = hindva.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let newCountries = 'var countries = [\n    ' + data.pointsCode + ',\n    { name: \'Mauritius\', x: 645, y: 265 }\n  ';
  let newHindva = hindva.substring(0, startIdx) + newCountries + hindva.substring(endIdx);
  
  // also update indiaX and indiaY
  newHindva = newHindva.replace('var indiaX = 680;', 'var indiaX = 721;');
  newHindva = newHindva.replace('var indiaY = 270;', 'var indiaY = 178;');
  
  fs.writeFileSync('../js/hindva.js', newHindva, 'utf8');
  console.log("Successfully updated hindva.js and world-map.svg!");
} else {
  console.log("Could not find countries array in hindva.js");
}
