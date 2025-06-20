let sketch = (p) => {
  let bg, glitchOverlay, wall;
  let blocks = [];
  let glitchMode = false;
  let glitchFrames = 0;
  let glitchLevel = 0;
  let maxBlocks = 7;
  let textureCache = [];
  let dx = 0, dy = 0;
  let invertMode = false;
  let invertTimer = 0;

  let isDead = false; 
  let touchCount = 0;
  let touchMax = Math.floor(Math.random() * 40) + 15; // entre 15 y 30

  p.preload = () => {
    bg = p.loadImage('mercadopago.png');
    glitchOverlay = p.loadImage('ejemp6.png');
    wall = p.loadImage('wall2.gif');
  };

  p.setup = () => {
  
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.colorMode(p.HSB, 360, 100, 100);
    p.rectMode(p.CORNER);
    p.noSmooth();
    cacheTextures();

    for (let i = 0; i < 10; i++) {
      blocks.push(new Block(p));
    }
  };

  p.draw = () => {
    if (isDead) {
      p.background(0);
      p.textSize(p.width * 0.15);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill('red');
      p.text("MORTEM", p.width / 2, p.height / 2);
      p.fill(255);
      p.textSize(p.width * 0.05);
      p.text("El dispositivo ha cumplido su ciclo.", p.width / 2, p.height * 0.7);
      p.text("Descansa en paz digital.", p.width / 2, p.height * 0.75);
      p.noLoop();
      return;
    }

    if (!invertMode && p.random(1) < 0.03) {
      invertMode = true;
      invertTimer = p.int(p.random(10, 200));
    } else if (invertMode) {
      invertTimer--;
      if (invertTimer <= 0) invertMode = false;
    }

    if (invertMode) {
      p.push();
      p.blendMode(p.DIFFERENCE);
      p.background(255);
      p.pop();
    } else {
      if (glitchLevel < 5) {
        p.image(glitchOverlay, 0, 0, p.width, p.height);
      } else {
        p.background(0, 0, 100);
      }
    }

    if (glitchOverlay && glitchLevel < 20) {
      p.tint(50, 0, 100, 10 + glitchLevel * 1.5);
      p.image(glitchOverlay, 0, 0, p.width, p.height);
      p.noTint();
    }

    if (glitchMode && glitchFrames > 0) {
      p.translate(dx, dy);
      glitchFrames--;
    } else {
      glitchMode = false;
    }

    for (let b of blocks) {
      b.display();
      b.move();
    }

    if (glitchMode) drawScanlines();
  };

  p.touchStarted = () => {
    if (isDead) return false;

    // Conteo de toques
    touchCount++;
    if (touchCount >= touchMax) {
      triggerDeath(); // activa el "MORTEM"
      return false;
    }

    if (glitchLevel < 20) glitchLevel++;

    glitchMode = true;
    glitchFrames = 1 + glitchLevel;
    dx = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);
    dy = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);

    let newBlocks = Math.min(3 + glitchLevel, maxBlocks - blocks.length);
    for (let i = 0; i < newBlocks; i++) {
      blocks.push(new Block(p));
    }

    for (let b of blocks) {
      if (p.random(1) < 0.4) {
        b.rect_w = p.random(p.width * 0.03, p.width * 0.15);
        b.rect_h = p.random(p.height * 0.02, p.height * 0.1);
        b.y += p.random(-glitchLevel * 5, glitchLevel * 5);
        b.speed = p.random([-1, 1]) * p.random(1 + glitchLevel, 3 + glitchLevel * 1.5);
        b.texture = p.random(textureCache);
      }
    }

    return false;
  };

  function triggerDeath() {
    isDead = true;
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  function drawScanlines() {
    p.stroke(0, 0, 100, 4);
    for (let y = 0; y < p.height; y += 6) {
      p.line(0, y, p.width, y);
    }
  }

  function cacheTextures() {
    let cols = 5;
    let rows = 5;;
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
    constructor(p) {
      this.p = p;
      this.speed = p.random([-0.5, 0.5]) * p.random(1, 4 + glitchLevel);
      this.rect_w = p.random(p.width * 0.04, p.width * 0.1);
      this.rect_h = p.random(p.height * 0.03, p.height * 0.08);
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.texture = p.random(textureCache);
    }

    display() {
      p.image(this.texture, this.x, this.y);

      if (glitchMode || glitchLevel === 15) {
        let copies = p.constrain(glitchLevel, 2, 3); // limitamos copias para móviles
        let useDifference = (glitchLevel === 15);

      /*   p.push();
        if (useDifference) p.blendMode(p.DIFFERENCE); */

        for (let i = 0; i < copies; i++) {
          let offsetX = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          let offsetY = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          p.tint(p.random(360), 80, 100, useDifference ? 60 : (20 + glitchLevel * 2));
          p.image(this.texture, this.x + offsetX, this.y + offsetY);
        }
        p.pop();
        p.noTint();
      }
    }

    move() {
      this.x += this.speed;

      if (this.x > p.width + this.rect_w || this.x < -this.rect_w) {
        this.rect_w = p.random(p.width * 0.04, p.width * 0.1);
        this.rect_h = p.random(p.height * 0.03, p.height * 0.08);
        this.y = p.random(p.height);
        this.x = (this.speed > 0) ? -this.rect_w : p.width + this.rect_w;
        this.texture = p.random(textureCache);
      }
    }
  }
};

// Inicializa el sketch
new p5(sketch);

let isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

if (isMobile) {
  p.pixelDensity(1);
  maxBlocks = 5;
  useDifference = false;
}
