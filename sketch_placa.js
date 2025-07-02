let sketch2 = (p) => {
  let imgs = [];
  let rotura;
  let glitchTimer = 0;
  let pixelRes = 6;

  let osc, noise, filter;
  let audioStarted = false;

  p.preload = () => {
    imgs[0] = p.loadImage('placa1.jpg');
    imgs[1] = p.loadImage('placa2.jpg');
    imgs[2] = p.loadImage('placa3.jpg');
    rotura = p.loadImage('rotura.jpg');
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noSmooth();
    p.frameRate(40);
    p.userStartAudio();

    osc = new p5.Oscillator('square');
    osc.freq(200);
    osc.amp(0.15);
    osc.start();

    noise = new p5.Noise('white');
    noise.amp(0.25);
    noise.start();

    filter = new p5.LowPass();
    filter.freq(900);
    osc.disconnect();
    noise.disconnect();
    osc.connect(filter);
    noise.connect(filter);

    audioStarted = true;
  };

  p.draw = () => {
    if (!imgs[0] || !rotura) {
      p.background(0);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Cargando imágenes...", p.width / 2, p.height / 2);
      return;
    }

    drawPixelated(p.random(imgs));

    if (p.millis() > glitchTimer) {
      glitchWhiteLines();
      glitchCuts();
      glitchScanLines();
      glitchStripes();
      glitchTimer = p.millis() + p.random(300, 700);

      if (audioStarted) {
        let freq = p.random(100, 777);
        let amp = p.random(0.1, 5);
        let filterFreq = p.random(300, 1000);

        osc.freq(freq, 0.5);
        osc.amp(amp, 5);
        noise.amp(amp + 2, 0.1);
        filter.freq(filterFreq);
      }
    }

    simulateScreenFracture();

    p.tint(80, 1);
    p.image(rotura, 0, 0, p.width, p.height);
    p.noTint();
  };

  function drawPixelated(img) {
    let smallW = p.width / pixelRes;
    let smallH = p.height / pixelRes;
    img.loadPixels();

    for (let y = 0; y < smallH; y++) {
      for (let x = 0; x < smallW; x++) {
        let sx = p.int(p.map(x, 0, smallW, 0, img.width));
        let sy = p.int(p.map(y, 0, smallH, 0, img.height));
        let c = img.get(sx, sy);
        p.fill(c);
        p.rect(x * pixelRes, y * pixelRes, pixelRes, pixelRes);
      }
    }
  }

  function glitchWhiteLines() {
    let lines = p.int(p.random(2, 6));
    for (let i = 0; i < lines; i++) {
      let y = p.int(p.random(p.height));
      let h = p.int(p.random(2, 6));
      p.fill(255);
      p.rect(0, y, p.width, h);
    }
  }

  function glitchCuts() {
    let cuts = p.int(p.random(1, 100));
    for (let i = 0; i < cuts; i++) {
      if (p.random() < 0.5) {
        let y = p.int(p.random(p.height));
        let h = p.int(p.random(4, 20));
        let offset = p.int(p.random(-60, 60));
        p.copy(p.random(imgs), 0, y, p.width, h, offset, y, p.width, h);
      } else {
        let x = p.int(p.random(p.width));
        let w = p.int(p.random(4, 20));
        let offset = p.int(p.random(-30, 30));
        p.copy(p.random(imgs), x, 0, w, p.height, x, offset, w, p.height);
      }
    }
  }

  function simulateScreenFracture() {
    let cols = 5;
    let rows = 10;
    let fragW = p.width / cols;
    let fragH = p.height / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = i * fragW;
        let y = j * fragH;
        let frag = p.get(x, y, fragW, fragH);
        p.push();
        let offsetX = p.random(-3, 3);
        let offsetY = p.random(-3, 30);
        let angle = p.random(-p.PI / 60, p.PI / 60);
        p.translate(x + fragW / 2 + offsetX, y + fragH / 2 + offsetY);
        p.rotate(angle);
        p.image(frag, -fragW / 2, -fragH / 2);
        p.pop();
      }
    }
  }

  function glitchScanLines() {
    let lines = p.int(p.random(3, 10));
    for (let i = 0; i < lines; i++) {
      let y = p.int(p.random(p.height));
      let h = p.int(p.random(1, 4));
      let offset = p.int(p.random(-20, 20));
      let r = p.get(0, y, p.width, h);
      let g = p.get(0, y, p.width, h);
      let b = p.get(0, y, p.width, h);
      p.push();
      p.tint(255, 0, 0);
      p.image(r, offset, y);
      p.tint(0, 255, 0);
      p.image(g, -offset, y + 1);
      p.tint(0, 0, 255);
      p.image(b, offset * 1.5, y + 2);
      p.pop();
    }
  }

  function glitchStripes() {
    let stripes = p.int(p.random(4, 10));
    for (let i = 0; i < stripes; i++) {
      let y = p.int(p.random(p.height));
      let h = p.int(p.random(2, 6));
      let stripe = p.get(0, y, p.width, h);
      let offsetX = p.int(p.random(-40, 40));
      let stretch = p.random(1.5, 4);
      p.push();
      p.translate(offsetX, 0);
      p.image(stripe, 0, y, p.width * stretch, h);
      p.pop();
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch2);
