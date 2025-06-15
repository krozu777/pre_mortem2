let bg, glitchOverlay, wall;
let blocks = [];
let glitchMode = false;
let glitchFrames = 1;
let glitchLevel = 0;
let maxBlocks = 100;

function preload() {
  bg = loadImage('mercadopago.png');
  glitchOverlay = loadImage('ejemp6.png');
  wall = loadImage('wall1.gif');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  rectMode(CORNER);
  noSmooth();

  for (let i = 0; i < 10; i++) {
    blocks.push(new Block());
  }
}

function draw() {
  if (glitchLevel < 20) {
    background(wall);
  } else {
    background(0, 0, 100);
  }

  if (glitchOverlay && glitchLevel < 20) {
    tint(0, 0, 100, 10 + glitchLevel * 1.5);
    image(wall, 0, 0, width, height);
    noTint();
  }

  if (glitchMode && glitchFrames > 0) {
    translate(random(-glitchLevel * 1.2, glitchLevel * 1.2), random(-glitchLevel * 1.2, glitchLevel * 1.2));
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

  let newBlocks = min(4 + glitchLevel, maxBlocks - blocks.length);
  for (let i = 0; i < newBlocks; i++) {
    blocks.push(new Block());
  }

  for (let b of blocks) {
    if (random(1) < 0.4) {
      b.rect_w = random(width * 0.03, width * 0.15);
      b.rect_h = random(height * 0.02, height * 0.1);
      b.y += random(-glitchLevel * 5, glitchLevel * 5);
      b.speed = random([-1, 1]) * random(1 + glitchLevel, 3 + glitchLevel * 1.5);
      b.updateTexture();
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

class Block {
  constructor() {
    this.speed = random([-1, 1]) * random(2, 4 + glitchLevel);
    this.rect_w = random(width * 0.04, width * 0.1);
    this.rect_h = random(height * 0.03, height * 0.08);
    this.x = random(width);
    this.y = random(height);
    this.texture = null;
    this.updateTexture();
  }

  updateTexture() {
    this.texture = bg.get(
      constrain(int(this.x), 0, bg.width - int(this.rect_w)),
      constrain(int(this.y), 0, bg.height - int(this.rect_h)),
      int(this.rect_w),
      int(this.rect_h)
    );
  }

  display() {
    image(this.texture, this.x, this.y);

    if (glitchMode || glitchLevel === 20) {
      let copies = constrain(glitchLevel, 3, 15);
      for (let i = 0; i < copies; i++) {
        let offsetX = random(-glitchLevel * 2, glitchLevel * 2);
        let offsetY = random(-glitchLevel * 2, glitchLevel * 2);

        if (glitchLevel === 20 && i % 2 === 0) {
          push();
          blendMode(DIFFERENCE);
          tint(random(100), 10, 100, 60);
          image(this.texture, this.x + offsetX, this.y + offsetY);
          pop();
        } else {
          tint(random(360), 80, 100, 20 + glitchLevel * 2);
          image(this.texture, this.x + offsetX, this.y + offsetY);
        }

        noTint();
      }
    }
  }

  move() {
    this.x += this.speed;

    if (this.x > width + this.rect_w || this.x < -this.rect_w) {
      this.rect_w = random(width * 0.04, width * 0.1);
      this.rect_h = random(height * 0.03, height * 0.08);
      this.y = random(height);
      this.x = (this.speed > 0) ? -this.rect_w : width + this.rect_w;
      this.updateTexture();
    }
  }
}

// Se adapta si cambia el tamaño de la ventana
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
