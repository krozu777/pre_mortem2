let sketch = (p) => {
  let bgFilenames = [
    'mercadopago.png',
    'facebookmarketplace.png',
  ];
  let glitchOverlayFilenames = [
    'ejemp6.png',
    'ejemplo8.jpeg',
    'ejemplo9.jpg',
  ];

  let bg = [];
  let glitchOverlay = [];
  let selectedBG;
  let selectedOverlay;

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
  let touchMax = Math.floor(Math.random() * 40) + 15;

  let socket;
  let isSketch3Active = false;
  let sketch3Timer = 0;

  let loadedImages = 0;
  let totalImages;

  // Audio
  let osc, noise;
  let isAudioStarted = false;

  p.preload = () => {
    totalImages = bgFilenames.length + glitchOverlayFilenames.length;

    for (let i = 0; i < bgFilenames.length; i++) {
      p.loadImage(
        bgFilenames[i],
        (img) => {
          bg.push(img);
          loadedImages++;
        },
        () => console.error("❌ No se pudo cargar", bgFilenames[i])
      );
    }

    for (let i = 0; i < glitchOverlayFilenames.length; i++) {
      p.loadImage(
        glitchOverlayFilenames[i],
        (img) => {
          glitchOverlay.push(img);
          loadedImages++;
        },
        () => console.error("❌ No se pudo cargar", glitchOverlayFilenames[i])
      );
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.colorMode(p.HSB, 360, 100, 100);
    p.rectMode(p.CORNER);
    p.noSmooth();
    p.frameRate(30);

    // Audio setup
    osc = new p5.Oscillator('square');
    osc.amp(0);
    osc.freq(440);
    osc.start();

    noise = new p5.Noise('white');
    noise.amp(0);
    noise.start();

    socket = new WebSocket('wss://server-7di9.onrender.com');
    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.warn("Mensaje no JSON:", event.data);
        return;
      }

      if (data.type === "launchSketch3") {
        isSketch3Active = data.active;
        console.log("Sketch 3 activo:", isSketch3Active);
      }
    };
  };

  p.draw = () => {
    if (loadedImages < totalImages) {
      p.background(0);
      p.fill(0, 0, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("Cargando imágenes...", p.width / 2, p.height / 2);
      return;
    }

    if (!selectedBG || !selectedOverlay) {
      selectedBG = p.random(bg);
      selectedOverlay = p.random(glitchOverlay);
      cacheTextures();
      for (let i = 0; i < 10; i++) {
        blocks.push(new Block(p));
      }
    }

    if (isSketch3Active) {
      runSketch3();
      return;
    }

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
      if (glitchLevel < 5 && selectedOverlay) {
        p.image(selectedOverlay, 0, 0, p.width, p.height);
      } else {
        p.background(0, 0, 100);
      }
    }

    if (selectedOverlay && glitchLevel < 20) {
      p.tint(5, 0, 100, 10 + glitchLevel * 1.5);
      p.image(selectedOverlay, 0, 0, p.width, p.height);
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

  function cacheTextures() {
    if (!selectedBG || !selectedBG.width) return;

    let cols = 4;
    let rows = 4;
    let tw = selectedBG.width / cols;
    let th = selectedBG.height / rows;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let tex = selectedBG.get(x * tw, y * th, tw, th);
        textureCache.push(tex);
      }
    }
  }

  function runSketch3() {
    p.background(0);
    p.fill(0, 100, 100);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, 100 + 30 * p.sin(p.frameCount * 0.1));

    if (p.millis() - sketch3Timer > 5000) {
      isSketch3Active = false;
    }
  }

  p.touchStarted = () => {
    if (isDead || loadedImages < totalImages) return false;

    if (!isAudioStarted) {
      p.userStartAudio();
      osc.start();
      noise.start();
      isAudioStarted = true;
    }

    touchCount++;
    if (touchCount >= touchMax) {
      triggerDeath();
      return false;
    }

    let oscVol = p.map(touchCount, 0, touchMax, 0.05, 0.2);
    osc.amp(oscVol, 0.1);

    let oscFreq = p.map(touchCount, 0, touchMax, 800, p.random(2000, 5000));
    osc.freq(oscFreq, 0.05);

    let noiseVol = p.map(touchCount, 0, touchMax, 0.05, 0.7);
    noise.amp(noiseVol, 0.1);
    noise.amp(noiseVol + 0.3, 0.01);
    noise.amp(noiseVol, 0.15, p.frameCount + 1);

    osc.freq(p.random(6000, 8000), 0.01);
    osc.freq(oscFreq, 0.15, p.frameCount + 1);

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
        b.speed = p.random([-1, 1]) * p.random(1 + glitchLevel * 0.5, 3 + glitchLevel);
        b.texture = p.random(textureCache);
      }
    }

    return false;
  };

  function triggerDeath() {
    isDead = true;
    if (isAudioStarted) {
      osc.stop();
      noise.stop();
      isAudioStarted = false;
    }
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
      if (!this.texture) return;
      p.image(this.texture, this.x, this.y);

      if (glitchMode || glitchLevel === 15) {
        let copies = p.constrain(glitchLevel, 2, 3);
        let useDifference = (glitchLevel === 15);

        for (let i = 0; i < copies; i++) {
          let offsetX = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          let offsetY = p.random(-glitchLevel * 1.5, glitchLevel * 2);
          p.tint(p.random(360), 80, 100, useDifference ? 60 : (20 + glitchLevel * 2));
          p.image(this.texture, this.x + offsetX, this.y + offsetY);
        }
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

new p5(sketch);
