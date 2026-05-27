'use strict';
const fs = require('fs');
const path = require('path');

// ── File Paths (relative to project root) ────────────────────────────
const CSS_PATH = path.join('code', 'css', 'style.css');
const JS_PATH = path.join('code', 'js', 'hindva.js');

// ── Helper: safe replace-all ──────────────────────────────────────────
function replaceAll(source, from, to) {
  return source.split(from).join(to);
}

// =====================================================================
//  1. UPDATE CSS — code/css/style.css
// =====================================================================
console.log('Reading:', CSS_PATH);
let css = fs.readFileSync(CSS_PATH, 'utf8');

// ── 1a. CSS Root Variables Block ─────────────────────────────────────
css = css.replace(
  `:root {
  --primary-dark: #0a0e27;
  --primary-deep: #060b1d;
  --primary-blue: #0d47a1;
  --mid-blue: #1565c0;
  --cyan: #00e5ff;
  --neon-green: #00ff88;
  --white: #ffffff;
  --light-gray: #b0bec5;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-bg-hover: rgba(255, 255, 255, 0.1);
  --gradient-cyan-green: linear-gradient(135deg, #00e5ff, #00ff88);
  --gradient-blue-cyan: linear-gradient(135deg, #0d47a1, #00e5ff);
  --shadow-glow-cyan: 0 0 30px rgba(0, 229, 255, 0.3);
  --shadow-glow-green: 0 0 30px rgba(0, 255, 136, 0.3);`,
  `:root {
  --primary-dark: #ffffff;
  --primary-deep: #f0f4f8;
  --primary-blue: #0d47a1;
  --mid-blue: #1565c0;
  --cyan: #0099cc;
  --neon-green: #00bf58;
  --white: #1a1a2e;
  --light-gray: #555555;
  --glass-bg: rgba(0, 0, 0, 0.03);
  --glass-border: rgba(0, 0, 0, 0.08);
  --glass-bg-hover: rgba(0, 0, 0, 0.06);
  --gradient-cyan-green: linear-gradient(135deg, #0d47a1, #00bf58);
  --gradient-blue-cyan: linear-gradient(135deg, #0d47a1, #0099cc);
  --shadow-glow-cyan: 0 4px 25px rgba(0, 153, 204, 0.15);
  --shadow-glow-green: 0 4px 25px rgba(0, 191, 88, 0.15);`
);

// ── 1b. CSS Bulk Replacements ─────────────────────────────────────────
const cssReplacements = [
  // Backgrounds
  ['background: var(--primary-dark);', 'background: #ffffff;'],
  ['background: var(--primary-deep);', 'background: #f0f4f8;'],
  ['background: var(--cyan);', 'background: #0d47a1;'],
  ['background: rgba(0, 229, 255, 0.35);', 'background: rgba(13, 71, 161, 0.2);'],
  ['background: rgba(255, 255, 255, 0.08);', 'background: rgba(0, 0, 0, 0.06);'],
  ['background: rgba(255, 255, 255, 0.05);', 'background: rgba(0, 0, 0, 0.03);'],
  ['background: rgba(10, 14, 39, 0.9);', 'background: rgba(255, 255, 255, 0.95);\n  border-bottom: 1px solid rgba(0,0,0,0.06);'],
  ['background: radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%);', 'background: radial-gradient(circle, rgba(13, 71, 161, 0.06) 0%, transparent 70%);'],
  ['background: radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, transparent 70%);', 'background: radial-gradient(circle, rgba(13, 71, 161, 0.04) 0%, transparent 70%);'],

  // Colors
  ['color: var(--white);', 'color: #1a1a2e;'],
  ['color: var(--primary-dark);', 'color: #ffffff;'],
  ['color: rgba(176, 190, 197, 0.5);', 'color: rgba(85, 85, 85, 0.5);'],

  // Scrollbar
  ['scrollbar-color: var(--cyan) var(--primary-deep);', 'scrollbar-color: #0d47a1 #f0f4f8;'],

  // Shadows
  ['box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);', 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);'],
  ['box-shadow: 0 4px 25px rgba(0, 229, 255, 0.4);', 'box-shadow: 0 4px 25px rgba(13, 71, 161, 0.3);'],
  ['box-shadow: 0 8px 35px rgba(0, 229, 255, 0.6);', 'box-shadow: 0 8px 35px rgba(13, 71, 161, 0.4);'],

  // Borders
  ['border-color: rgba(0, 229, 255, 0.4);', 'border-color: rgba(13, 71, 161, 0.3);'],
  ['border-color: rgba(0, 229, 255, 0.3);', 'border-color: rgba(13, 71, 161, 0.2);'],

  // Spacing tweaks
  ['margin: 0 auto 60px;', 'margin: 0 auto 30px;'],
  ['gap: 30px;\n  max-width: 1000px;', 'gap: 20px;\n  max-width: 1000px;'],
  ['padding: 30px;\n  text-align: center;', 'padding: 20px 15px;\n  text-align: center;'],
];

for (const [from, to] of cssReplacements) {
  css = replaceAll(css, from, to);
}

// ── 1c. CSS Specific Selector Overrides ──────────────────────────────
css = css.replace('.nav-links a {\n  color: var(--light-gray);', '.nav-links a {\n  color: #555555;');
css = css.replace('.nav-links a:hover {\n  color: var(--white);', '.nav-links a:hover {\n  color: #1a1a2e;');
css = css.replace('.nav-links a.active {\n  color: var(--cyan);', '.nav-links a.active {\n  color: #0d47a1;');
css = css.replace(
  '.hamburger span {\n  display: block;\n  width: 25px;\n  height: 2px;\n  background: var(--white);',
  '.hamburger span {\n  display: block;\n  width: 25px;\n  height: 2px;\n  background: #1a1a2e;'
);
css = css.replace(
  '.hero-content h1 {\n  font-family: var(--font-heading);\n  font-size: clamp(36px, 6vw, 72px);\n  font-weight: 800;\n  line-height: 1.1;\n  margin-bottom: 25px;\n  color: var(--white);',
  '.hero-content h1 {\n  font-family: var(--font-heading);\n  font-size: clamp(36px, 6vw, 72px);\n  font-weight: 800;\n  line-height: 1.1;\n  margin-bottom: 25px;\n  color: #1a1a2e;'
);

fs.writeFileSync(CSS_PATH, css, 'utf8');
console.log('✔ CSS updated:', CSS_PATH);

// =====================================================================
//  2. UPDATE JS — code/js/hindva.js  (single pass — all sections)
// =====================================================================
console.log('Reading:', JS_PATH);
let js = fs.readFileSync(JS_PATH, 'utf8');

// ── 2a. Particle / animation color strings ────────────────────────────
js = replaceAll(js, "'rgba(0, 229, 255, ',", "'rgba(13, 71, 161, ',");
js = replaceAll(js, "'rgba(0, 255, 136, ',", "'rgba(0, 191, 88, ',");

// ── 2b. Radial gradient blob colors ──────────────────────────────────
js = replaceAll(js, "'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',", "'radial-gradient(circle, rgba(13,71,161,0.05) 0%, transparent 70%)',");
js = replaceAll(js, "'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',", "'radial-gradient(circle, rgba(0,191,88,0.04) 0%, transparent 70%)',");
js = replaceAll(js, "'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',", "'radial-gradient(circle, rgba(13,71,161,0.03) 0%, transparent 70%)',");
js = replaceAll(js, "'radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)',", "'radial-gradient(circle, rgba(0,191,88,0.05) 0%, transparent 70%)',");

// ── 2c. World-map SVG fill / stroke colors ────────────────────────────
js = replaceAll(js, "rgba(0, 229, 255, 0.15)", "rgba(13, 71, 161, 0.15)");
js = replaceAll(js, "fill: '#00e5ff'", "fill: '#0d47a1'");
js = replaceAll(js, "fill: '#00ff88'", "fill: '#00bf58'");
// Restore India hub dot overridden by previous fill swap
js = replaceAll(js, "fill: '#0d47a1' // India hub", "fill: '#00bf58' // India hub");
js = replaceAll(js, "stroke: 'rgba(0, 229, 255, 0.4)'", "stroke: 'rgba(13, 71, 161, 0.4)'");

// ── 2d. General rgba color replacements ──────────────────────────────
js = replaceAll(js, "rgba(0, 229, 255,", "rgba(13, 71, 161,");
js = replaceAll(js, "rgba(0, 255, 136,", "rgba(0, 191, 88,");

fs.writeFileSync(JS_PATH, js, 'utf8');
console.log('✔ JS  updated:', JS_PATH);

console.log('\n✅ Theme update completed successfully!\n');
