let bg, glitchOverlay, wall;
let blocks = [];
let glitchMode = false;
let glitchFrames = 0;
let glitchLevel = 0;
let maxBlocks = 10;
let textureCache = [];
let dx = 0, dy = 0;

let invertMode = false;
let invertTimer = 0;

function preload() {
  bg = loadImage('mercadopago.png');
  glitchOverlay = loadImage('ejemp6.png');
  wall = loadImage('wall2.gif');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  //frameRate(10);
  //pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  rectMode(CORNER);
  noSmooth();
  cacheTextures();

  for (let i = 0; i < 5; i++) {
    blocks.push(new Block());
  }
}

function draw() {
  // Skipping frames si glitchLevel es alto
 // if (glitchLevel > 15 && frameCount % 2 === 0) return;

  // Inversión de colores random
  if (!invertMode && random(1) < 0.05) {
    invertMode = true;
    invertTimer = int(random(10, 60));
  } else if (invertMode) {
    invertTimer--;
    if (invertTimer <= 0) invertMode = false;
  }

  if (invertMode) {
    push();
    blendMode(DIFFERENCE);
    background(255);
    pop();
  } else {
    if (glitchLevel < 20) {
      background(wall);
    } else {
      background(0, 0, 100);
    }
  }

  if (glitchOverlay && glitchLevel < 20) {
    tint(0, 0, 100, 10 + glitchLevel * 1.5);
    image(wall, 0, 0, width, height);
    noTint();
  }

  if (glitchMode && glitchFrames > 0) {
    translate(dx, dy);
    glitchFrames--;
  } else {
    glitchMode = false;
  }

  for (let b of blocks) {
    b.display();
    b.move();
  }

  if (glitchMode) drawScanlines();
}

function touchStarted() {
  if (glitchLevel < 20) glitchLevel++;

  glitchMode = true;
  glitchFrames = 2 + glitchLevel;
  dx = random(-glitchLevel * 1.2, glitchLevel * 1.2);
  dy = random(-glitchLevel * 1.2, glitchLevel * 1.2);

  let newBlocks = min(3 + glitchLevel, maxBlocks - blocks.length);
  for (let i = 0; i < newBlocks; i++) {
    blocks.push(new Block());
  }

  for (let b of blocks) {
    if (random(1) < 0.4) {
      b.rect_w = random(width * 0.03, width * 0.15);
      b.rect_h = random(height * 0.02, height * 0.1);
      b.y += random(-glitchLevel * 5, glitchLevel * 5);
      b.speed = random([-1, 1]) * random(1 + glitchLevel, 3 + glitchLevel * 1.5);
      b.texture = random(textureCache);
    }
  }

  return false;
}

function drawScanlines() {
  stroke(0, 0, 100, 4);
  for (let y = 0; y < height; y += 6) {
    line(0, y, width, y);
  }
}

function cacheTextures() {
  let cols = 6;
  let rows = 6;
  let tw = bg.width / cols;
  let th = bg.height / rows;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let tex = bg.get(x * tw, y * th, tw, th);
      textureCache.push(tex);
    }
  }
}

class Block {
  constructor() {
    this.speed = random([-1, 1]) * random(2, 4 + glitchLevel);
    this.rect_w = random(width * 0.04, width * 0.1);
    this.rect_h = random(height * 0.03, height * 0.08);
    this.x = random(width);
    this.y = random(height);
    this.texture = random(textureCache);
  }

  display() {
    image(this.texture, this.x, this.y);

    if (glitchMode || glitchLevel === 20) {
      let copies = constrain(glitchLevel, 3, 8);
      let useDifference = (glitchLevel === 20);

      push();
      if (useDifference) blendMode(DIFFERENCE);

      for (let i = 0; i < copies; i++) {
        let offsetX = random(-glitchLevel * 2, glitchLevel * 2);
        let offsetY = random(-glitchLevel * 2, glitchLevel * 2);
        tint(random(360), 80, 100, useDifference ? 60 : (20 + glitchLevel * 2));
        image(this.texture, this.x + offsetX, this.y + offsetY);
      }

      pop();
      noTint();
    }
  }

  move() {
    this.x += this.speed;

    if (this.x > width + this.rect_w || this.x < -this.rect_w) {
      this.rect_w = random(width * 0.04, width * 0.1);
      this.rect_h = random(height * 0.03, height * 0.08);
      this.y = random(height);
      this.x = (this.speed > 0) ? -this.rect_w : width + this.rect_w;
      this.texture = random(textureCache);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
