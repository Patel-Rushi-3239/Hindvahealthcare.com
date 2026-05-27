const fs = require('fs');
const topojson = require('topojson-client');
const d3 = require('d3-geo');

// The countries we need coordinates for
const targetCountries = [
  'India', 'Bangladesh', 'Belarus', 'Bhutan', 'Brazil', 'Cambodia', 
  'United Arab Emirates', 'Ghana', 'Indonesia', 'Iran', 'Iraq', 'Jordan', 
  'Kenya', 'Kuwait', 'Libya', 'Malaysia', 'Mauritius', 'Nepal', 
  'Nigeria', 'Oman', 'Philippines', 'Russia', 'South Korea', 'Sri Lanka', 
  'Switzerland', 'Tanzania', 'United Kingdom', 'Vietnam', 'Yemen', 
  'Zambia', 'Zimbabwe'
];

// Mapping custom names to TopoJSON names if needed
const nameMap = {
  'UAE': 'United Arab Emirates',
  'UAE / Dubai': 'United Arab Emirates',
  'South Korea': 'South Korea',
  'Russia': 'Russia' // Sometimes it's Russian Federation
};

// Load world-atlas topojson (110m is good for typical web maps)
const worldData = require('world-atlas/countries-110m.json');

// Convert topojson to geojson
const countriesGeo = topojson.feature(worldData, worldData.objects.countries);

// Setup a projection (1000x500 is roughly 2:1 aspect ratio, good for Equirectangular)
// Let's use a nice projection like geoEquirectangular or geoMercator.
// D3's default for Equirectangular is already fine.
const projection = d3.geoEquirectangular()
  .fitSize([1000, 500], countriesGeo);

const pathGenerator = d3.geoPath().projection(projection);

// Generate the single beautiful SVG path for all landmasses
const worldPath = pathGenerator(countriesGeo);

// Find the coordinates for each target country
const results = [];
targetCountries.forEach(name => {
  let mappedName = nameMap[name] || name;
  let feature = countriesGeo.features.find(f => 
    f.properties.name === mappedName || 
    f.properties.name.includes(mappedName) ||
    (mappedName === 'Russia' && f.properties.name.includes('Russian'))
  );
  
  if (feature) {
    let centroid = d3.geoCentroid(feature);
    let [x, y] = projection(centroid);
    results.push(`{ name: '${name}', x: ${Math.round(x)}, y: ${Math.round(y)}${name === 'India' ? ', major: true' : ''} }`);
  } else {
    console.log("NOT FOUND:", name);
  }
});

fs.writeFileSync('generated_map.json', JSON.stringify({
  svgPath: worldPath,
  pointsCode: results.join(',\n    ')
}, null, 2));

console.log("Done! Check generated_map.json");
