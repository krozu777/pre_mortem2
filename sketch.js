let sketch = (p) => {
  // Archivos de imagen de fondo
  let bgFilenames = ['mercadopago.png', 'facebookmarketplace.png'];

  // Imágenes de superposición glitch
  let glitchOverlayFilenames = ['ejemp6.png', 'ejemplo8.jpeg', 'ejemplo9.jpg'];

  // Imagen final que se muestra al “morir”
  let finalImage;

  // Arrays para guardar las imágenes cargadas
  let bg = [], glitchOverlay = [];

  // Imágenes seleccionadas al azar
  let selectedBG, selectedOverlay;

  // Bloques glitch que se mueven
  let blocks = [];

  // Variables de estado glitch
  let glitchMode = false;
  let glitchFrames = 0;
  let glitchLevel = 0;
  let maxBlocks = 7;
  let textureCache = [];

  // Movimiento aleatorio de imagen cuando hay glitch
  let dx = 0, dy = 0;

  // Modo de inversión de color (efecto visual)
  let invertMode = false;
  let invertTimer = 0;

  // Estado de muerte
  let isDead = false;

  // Conteo de toques
  let touchCount = 0;

  // Límite aleatorio de toques para morir
  let touchMax = Math.floor(Math.random() * 40) + 15;

  // Control de temporizador para reset
  let resetTimerStarted = false;
  let resetStartTime = 0;

  // WebSocket para control externo
  let socket;
  let isSketch3Active = false;
  let sketch3Timer = 0;

  // Carga de imágenes
  let loadedImages = 0;
  let totalImages;
  let cruzImg;

  // Variables de audio
  let osc, noise;
  let isAudioStarted = false;

  // Variable cruz
  let mostrarCruz = false;
  let cruzX = 0;
  let cruzY = 0;

  // ---------------------------
  // 🔄 CARGA DE IMÁGENES
  p.preload = () => {
    totalImages = bgFilenames.length + glitchOverlayFilenames.length;
    finalImage = p.loadImage('cargafinal1.png');
    cruzImg = p.loadImage('arriba_borde.jpg');

    // Carga de imágenes de fondo
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

    // Carga de imágenes overlay (efecto glitch)
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

  // ---------------------------
  // 🎨 CONFIGURACIÓN INICIAL
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.colorMode(p.HSB, 360, 100, 100);
    p.rectMode(p.CORNER);
    p.noSmooth();
    p.frameRate(30);

    // Configuración de audio
    osc = new p5.Oscillator('square');
    osc.amp(0); osc.freq(440); osc.start();

    noise = new p5.Noise('white');
    noise.amp(0); noise.start();

    // WebSocket: escucha señales externas
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

  // ---------------------------
  // 🖼️ LOOP PRINCIPAL
  p.draw = () => {
    if (loadedImages < totalImages) {
      // Muestra mensaje de carga hasta que estén listas todas las imágenes
      p.background(0);
      p.fill(0, 0, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("Cargando imágenes...", p.width / 2, p.height / 2);
      return;
    }

    // Si aún no se han seleccionado imágenes de fondo y overlay, hacerlo
    if (!selectedBG || !selectedOverlay) {
      selectedBG = p.random(bg);
      selectedOverlay = p.random(glitchOverlay);
      cacheTextures();
      for (let i = 0; i < 10; i++) {
        blocks.push(new Block(p));
      }
    }

    // Si está activo el sketch 3 (por WebSocket), se dibuja eso
    if (isSketch3Active) {
      runSketch3();
      return;
    }

    // Si está en estado "muerto"
    if (isDead) {
      p.image(cruzImg, 0, 0, p.width, p.height);

      if (mostrarCruz === true) {
        p.blendMode(p.ADD);
        p.image(finalImage, cruzX, cruzY, 2000, 1900);
        p.blendMode(p.BLEND);
      }

      if (resetTimerStarted && p.millis() - resetStartTime >= 120000) {
        resetSketch();
      }

      return;
    }

    // Efecto de inversión de color aleatorio
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

  // ⚙️ Crea caché de texturas desde la imagen de fondo
  function cacheTextures() {
    if (!selectedBG || !selectedBG.width) return;

    let cols = 4, rows = 4;
    let tw = selectedBG.width / cols;
    let th = selectedBG.height / rows;

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let tex = selectedBG.get(x * tw, y * th, tw, th);
        textureCache.push(tex);
      }
    }
  }

  // 🌕 Sketch 3 alternativo (cuando llega señal externa)
  function runSketch3() {
    p.background(0);
    p.fill(0, 100, 100);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, 100 + 30 * p.sin(p.frameCount * 0.1));

    if (p.millis() - sketch3Timer > 5000) {
      isSketch3Active = false;
    }
  }

  // ---------------------------
  // 👆 Detectar toque/tap en pantalla
  p.touchStarted = () => {

    if (isDead) {
      mostrarCruz = true;
      cruzX = p.mouseX;
      cruzY = p.mouseY;
      return false;
    }

    if (isDead || loadedImages < totalImages) return false;

    if (!isAudioStarted) {
      p.userStartAudio();
      osc.start();
      noise.start();
      isAudioStarted = true;
    }

    touchCount++;

    // Si se alcanzó el límite de toques, muere
    if (touchCount >= touchMax) {
      triggerDeath();
      return false;
    }

    // Cambios de volumen y frecuencia del sonido
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

    // Incrementar efectos glitch
    if (glitchLevel < 20) glitchLevel++;

    glitchMode = true;
    glitchFrames = 1 + glitchLevel;
    dx = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);
    dy = p.random(-glitchLevel * 1.2, glitchLevel * 1.2);

    // Agrega nuevos bloques glitch
    let newBlocks = Math.min(3 + glitchLevel, maxBlocks - blocks.length);
    for (let i = 0; i < newBlocks; i++) {
      blocks.push(new Block(p));
    }

    // Modifica algunos bloques aleatoriamente
    for (let b of blocks) {
      if (p.random(1) < 0.4) {
        b.rect_w = p.random(p.width * 0.03, p.width * 0.15);
        b.rect_h = p.random(p.height * 0.02, p.height * 0.1);
        b.y += p.random(-glitchLevel * 5, glitchLevel * 5);
        b.speed = p.random([-1, 1]) * p.random(1 + glitchLevel * 0.5, 3 + glitchLevel);
        b.texture = p.random(textureCache);
      }
      ///////////


    }

    return false;
  };

  p.mouseReleased = function () {
    if (isDead) {
      mostrarCruz = false;
    }
  };

  // ---------------------------
  // ☠️ Activar estado de muerte
  function triggerDeath() {
    isDead = true;
    resetTimerStarted = true;
    resetStartTime = p.millis();

    if (isAudioStarted) {
      osc.stop();
      noise.stop();
      isAudioStarted = false;
    }
  }

  // ---------------------------
  // 🔄 Reset del sketch después de 2 min
  function resetSketch() {
    // Reestablecer variables
    blocks = [];
    glitchMode = false;
    glitchFrames = 0;
    glitchLevel = 0;
    textureCache = [];
    dx = 0; dy = 0;
    invertMode = false;
    invertTimer = 0;

    isDead = false;
    resetTimerStarted = false;
    resetStartTime = 0;

    touchCount = 0;
    touchMax = Math.floor(Math.random() * 10) + 15;

    selectedBG = p.random(bg);
    selectedOverlay = p.random(glitchOverlay);
    cacheTextures();

    for (let i = 0; i < 10; i++) {
      blocks.push(new Block(p));
    }

    if (!isAudioStarted) {
      osc.start();
      noise.start();
      isAudioStarted = true;
    }

    // 🔁 Comunicar al padre que ya no está muerto
    window.parent.postMessage({ type: 'isDead', value: false }, '*');
  }

  // ---------------------------
  // ⚙️ Ajustar canvas al tamaño de ventana
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  // ---------------------------
  // 📺 Líneas horizontales estilo CRT
  function drawScanlines() {
    p.stroke(0, 0, 100, 4);
    for (let y = 0; y < p.height; y += 6) {
      p.line(0, y, p.width, y);
    }
  }

  // ---------------------------
  // 🧱 Clase de bloques glitch
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

    // Mostrar bloque en pantalla
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

    // Movimiento horizontal del bloque
    move() {
      this.x += this.speed;

      // Si sale de la pantalla, reinicia su posición
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
//////


// Inicializa el sketch
new p5(sketch);
