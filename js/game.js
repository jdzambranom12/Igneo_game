/**
 * ÍGNEO: PONG DE FUEGO - Motor de Juego y Física de Pong
 * Gestiona el ciclo principal (game loop), la bola de energía roja,
 * el control de Ígneo, la arena volcánica y el sistema de tres vidas.
 */

class IgneoPlayer {
  constructor() {
    this.width = CONFIG.IGNEO.PADDLE_WIDTH;
    this.visualHeight = CONFIG.IGNEO.VISUAL_HEIGHT;
    this.hitboxHeight = CONFIG.IGNEO.HITBOX_HEIGHT;
    this.x = CONFIG.COURT.WIDTH / 2;
    this.y = CONFIG.IGNEO.Y_CENTER;
    
    this.vx = 0;
    this.targetX = this.x;
    this.hitAnimationTimer = 0;
    this.shockedAnimationTimer = 0;
    this.cheerAnimationTimer = 0;
    this.state = 'idle'; // 'idle', 'move_left', 'move_right', 'hit', 'shocked', 'cheer'
  }

  reset() {
    this.x = CONFIG.COURT.WIDTH / 2;
    this.targetX = this.x;
    this.vx = 0;
    this.hitAnimationTimer = 0;
    this.shockedAnimationTimer = 0;
    this.cheerAnimationTimer = 0;
    this.state = 'idle';
  }

  triggerHitAnimation() {
    this.hitAnimationTimer = 0.35;
    this.state = 'hit';
  }

  triggerShockedAnimation() {
    this.shockedAnimationTimer = 1.2;
    this.state = 'shocked';
  }

  triggerCheerAnimation() {
    this.cheerAnimationTimer = 0.8;
    this.state = 'cheer';
  }

  update(dt, inputState) {
    // 1. Manejo de animaciones temporales
    if (this.hitAnimationTimer > 0) {
      this.hitAnimationTimer -= dt;
      if (this.hitAnimationTimer <= 0 && this.shockedAnimationTimer <= 0 && this.cheerAnimationTimer <= 0) {
        this.state = 'idle';
      }
    }

    if (this.shockedAnimationTimer > 0) {
      this.shockedAnimationTimer -= dt;
      if (this.shockedAnimationTimer <= 0) {
        this.state = 'idle';
      }
    }

    if (this.cheerAnimationTimer > 0) {
      this.cheerAnimationTimer -= dt;
      if (this.cheerAnimationTimer <= 0) {
        this.state = 'idle';
      }
    }

    // 2. Control de movimiento (Teclado o Puntero/Táctil)
    if (inputState.isPointerActive) {
      // Seguimiento suave del puntero / mouse / touch
      const dx = inputState.pointerX - this.x;
      this.x += dx * 0.35; // Respuesta inmediata y suave
      this.vx = dx * 10;
    } else {
      // Control por teclado (Flechas o A/D)
      let moveDir = 0;
      if (inputState.left) moveDir -= 1;
      if (inputState.right) moveDir += 1;

      if (moveDir !== 0) {
        this.vx += moveDir * CONFIG.IGNEO.ACCELERATION * dt;
        const maxSpd = CONFIG.IGNEO.MOVE_SPEED;
        this.vx = Math.max(-maxSpd, Math.min(maxSpd, this.vx));
      } else {
        this.vx *= Math.pow(CONFIG.IGNEO.FRICTION, dt * 60);
        if (Math.abs(this.vx) < 5) this.vx = 0;
      }

      this.x += this.vx * dt;
    }

    // Actualizar estado de animación si no está en animación especial
    if (this.hitAnimationTimer <= 0 && this.shockedAnimationTimer <= 0 && this.cheerAnimationTimer <= 0) {
      if (this.vx < -20) {
        this.state = 'move_left';
      } else if (this.vx > 20) {
        this.state = 'move_right';
      } else {
        this.state = 'idle';
      }
    }

    // 3. Limitar a los márgenes del escenario volcánico
    const halfWidth = this.width / 2;
    const minX = 24 + halfWidth;
    const maxX = CONFIG.COURT.WIDTH - 24 - halfWidth;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  getHitbox() {
    const hitboxY = this.y + CONFIG.IGNEO.HITBOX_Y_OFFSET;
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: hitboxY - this.hitboxHeight / 2,
      bottom: hitboxY + this.hitboxHeight / 2
    };
  }

  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sprite = assetManager.getIgneoSprite(this.state);
    let renderW = this.width;
    let renderH = this.visualHeight;

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      renderH = this.visualHeight;
      renderW = renderH * aspect;
    }

    const drawX = this.x - renderW / 2;
    const drawY = this.y - renderH / 2;

    // Resplandor ardiente bajo los pies de Ígneo
    const flameGlow = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, renderW * 0.75);
    flameGlow.addColorStop(0, 'rgba(255, 110, 64, 0.45)');
    flameGlow.addColorStop(0.5, 'rgba(255, 61, 0, 0.2)');
    flameGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flameGlow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, renderW * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Sombra volcánica bajo los pies
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + renderH / 2 - 4, renderW * 0.45, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar sprite de Ígneo en alta definición manteniendo proporción
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, drawX, drawY, renderW, renderH);
    } else {
      // Respaldo estilizado
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, renderW, renderH, 16);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffeb3b';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ígneo', this.x, this.y + 6);
    }

    // Línea de defensa incandescente en la zona de contacto
    const hitY = this.y + CONFIG.IGNEO.HITBOX_Y_OFFSET;
    const hitGrad = ctx.createLinearGradient(this.x - this.width / 2, hitY, this.x + this.width / 2, hitY);
    hitGrad.addColorStop(0, 'rgba(255, 61, 0, 0)');
    hitGrad.addColorStop(0.5, 'rgba(255, 235, 59, 0.7)');
    hitGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
    ctx.fillStyle = hitGrad;
    ctx.fillRect(this.x - this.width / 2, hitY - 2, this.width, 4);

    ctx.restore();
  }
}

class RedEnergyBall {
  constructor() {
    this.radius = CONFIG.BALL.RADIUS;
    this.x = CONFIG.COURT.WIDTH / 2;
    this.y = CONFIG.COURT.HEIGHT / 2;
    this.vx = 0;
    this.vy = 0;
    this.speed = CONFIG.BALL.INITIAL_SPEED;
    this.inPlay = false;
    this.pulseTime = 0;
  }

  reset(serveTowardsFlora = true, speed = CONFIG.BALL.INITIAL_SPEED) {
    this.x = CONFIG.COURT.WIDTH / 2;
    this.y = CONFIG.COURT.HEIGHT / 2;
    this.speed = Math.min(CONFIG.BALL.MAX_SPEED, speed);
    this.inPlay = false;

    // Ángulo de saque con ligera inclinación aleatoria
    const angleOffset = (Math.random() - 0.5) * 0.6; // Entre -17 y +17 grados
    const baseAngle = serveTowardsFlora ? -Math.PI / 2 : Math.PI / 2;
    const finalAngle = baseAngle + angleOffset;

    this.vx = Math.cos(finalAngle) * this.speed;
    this.vy = Math.sin(finalAngle) * this.speed;
  }

  launch() {
    this.inPlay = true;
  }

  update(dt) {
    if (!this.inPlay) return;

    const nextSpeed = Math.min(
      CONFIG.BALL.MAX_SPEED,
      this.speed + CONFIG.BALL.SPEED_RAMP_PER_SECOND * dt
    );
    const speedScale = nextSpeed / this.speed;
    this.vx *= speedScale;
    this.vy *= speedScale;
    this.speed = nextSpeed;

    this.pulseTime += dt * 8;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Emitir partículas de fuego
    particleSystem.addBallTrail(this.x, this.y, this.radius);
  }

  render(ctx) {
    ctx.save();

    // 1. Aura resplandeciente exterior
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.15;
    const outerAura = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.3,
      this.x, this.y, this.radius * 2.8 * pulseScale
    );
    outerAura.addColorStop(0, 'rgba(255, 61, 0, 0.85)');
    outerAura.addColorStop(0.4, 'rgba(213, 0, 0, 0.45)');
    outerAura.addColorStop(1, 'rgba(213, 0, 0, 0)');

    ctx.fillStyle = outerAura;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.8 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // 2. Núcleo de energía roja con centro incandescente
    const coreGrad = ctx.createRadialGradient(
      this.x - 2, this.y - 2, 1,
      this.x, this.y, this.radius
    );
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.2, '#fff3e0');
    coreGrad.addColorStop(0.5, '#ff3d00');
    coreGrad.addColorStop(1, '#b71c1c');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Anillo sutil de energía
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Inicializar dimensiones fijas internas del canvas
    this.canvas.width = CONFIG.COURT.WIDTH;
    this.canvas.height = CONFIG.COURT.HEIGHT;

    this.player = new IgneoPlayer();
    this.bot = new FloraBot();
    this.ball = new RedEnergyBall();

    // Entradas de control
    this.inputState = {
      left: false,
      right: false,
      pointerX: CONFIG.COURT.WIDTH / 2,
      isPointerActive: false
    };

    // Estado de partida
    this.isRunning = false;
    this.isPaused = false;
    this.playerName = '';
    this.score = 0;
    this.lives = CONFIG.LIVES.INITIAL; // Exactamente 3
    this.botLives = CONFIG.LIVES.INITIAL;
    this.round = 1;
    this.rallyCount = 0;
    this.maxRally = 0;
    this.currentMultiplier = 1;
    this.maxCombo = 1;

    // Control de pausas internas (saque, vida perdida, punto anotado)
    this.pauseTimer = 0;
    this.pauseReason = ''; // 'serve', 'life_lost', 'goal'
    this.serveDirection = true; // true: hacia Flora, false: hacia Ígneo

    // Efecto de sacudida de pantalla (Screen Shake)
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    // Callbacks a la UI
    this.onScoreUpdate = null;
    this.onLivesUpdate = null;
    this.onBotLivesUpdate = null;
    this.onRoundUpdate = null;
    this.onGameOver = null;
    this.onNotification = null;

    this.lastTime = 0;
    this.animFrameId = null;

    // Inicializar partículas
    particleSystem.init(CONFIG.COURT.WIDTH, CONFIG.COURT.HEIGHT);
    this._bindControls();
  }

  _bindControls() {
    // 1. Teclado
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code || e.key)) {
        this.inputState.left = true;
        this.inputState.isPointerActive = false;
      }
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code || e.key)) {
        this.inputState.right = true;
        this.inputState.isPointerActive = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code || e.key)) {
        this.inputState.left = false;
      }
      if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code || e.key)) {
        this.inputState.right = false;
      }
    });

    // 2. Ratón
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.inputState.pointerX = (e.clientX - rect.left) * scaleX;
      this.inputState.isPointerActive = true;
    });

    // 3. Táctil (Móvil / Tablet)
    const handleTouch = (e) => {
      if (!this.isRunning || this.isPaused) return;
      e.preventDefault();
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.inputState.pointerX = (touch.clientX - rect.left) * scaleX;
        this.inputState.isPointerActive = true;
      }
    };

    this.canvas.addEventListener('touchstart', handleTouch, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouch, { passive: false });
  }

  startNewGame(playerName) {
    this.playerName = (playerName || 'ÍGNEO').trim().toUpperCase();
    this.score = 0;
    this.lives = CONFIG.LIVES.INITIAL; // Exactamente 3 vidas
    this.botLives = CONFIG.LIVES.INITIAL;
    this.round = 1;
    this.rallyCount = 0;
    this.maxRally = 0;
    this.currentMultiplier = 1;
    this.maxCombo = 1;
    this.shakeIntensity = 0;

    this.player.reset();
    this.bot.reset();
    this.bot.setRound(this.round);
    this._resetBall(true, false);

    this.pauseTimer = CONFIG.TIMINGS.SERVE_DELAY;
    this.pauseReason = 'serve';

    this.isRunning = true;
    this.isPaused = false;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.currentMultiplier);
    if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
    if (this.onBotLivesUpdate) this.onBotLivesUpdate(this.botLives);
    if (this.onRoundUpdate) this.onRoundUpdate(this.round);

    soundManager.startAmbient();

    this.lastTime = performance.now();
    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame((t) => this._loop(t));
    }
  }

  _resetBall(serveTowardsFlora, preserveSpeed = true) {
    const lostBotLives = CONFIG.LIVES.INITIAL - this.botLives;
    const roundSpeed = CONFIG.BALL.INITIAL_SPEED + lostBotLives * 50;
    const speed = preserveSpeed ? Math.max(roundSpeed, this.ball.speed) : roundSpeed;
    this.ball.reset(serveTowardsFlora, speed);
  }

  setPaused(paused) {
    this.isPaused = paused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    soundManager.stopAmbient();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  triggerScreenShake(intensity = 8, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  _loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this._update(dt);
    }
    this._render();

    this.animFrameId = requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    // 1. Manejo de sacudida de pantalla
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeIntensity = 0;
    }

    // 2. Manejo de pausas de saque / transición
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.ball.launch();
        if (this.onNotification) this.onNotification(null);
      }
    }

    // 3. Actualizar partículas
    particleSystem.update(dt, CONFIG.COURT.WIDTH, CONFIG.COURT.HEIGHT);

    // 4. Actualizar personajes y bola
    this.player.update(dt, this.inputState);
    this.bot.update(dt, this.ball, this.rallyCount);
    this.ball.update(dt);

    // 5. Físicas y Colisiones
    if (this.ball.inPlay) {
      this._handleCollisions();
    }
  }

  _handleCollisions() {
    const ball = this.ball;
    const wallLeft = 24 + ball.radius;
    const wallRight = CONFIG.COURT.WIDTH - 24 - ball.radius;

    // A. Rebote en paredes laterales de roca volcánica
    if (ball.x <= wallLeft) {
      ball.x = wallLeft;
      ball.vx = Math.abs(ball.vx);
      soundManager.playWallBounce();
      particleSystem.addImpactSparks(ball.x, ball.y, 8, true);
    } else if (ball.x >= wallRight) {
      ball.x = wallRight;
      ball.vx = -Math.abs(ball.vx);
      soundManager.playWallBounce();
      particleSystem.addImpactSparks(ball.x, ball.y, 8, true);
    }

    // B. Colisión con la paleta de ÍGNEO (Parte Inferior - Jugador)
    if (ball.vy > 0) {
      const pBox = this.player.getHitbox();
      // Verificación de intersección en caja delimitadora
      if (
        ball.x + ball.radius >= pBox.left &&
        ball.x - ball.radius <= pBox.right &&
        ball.y - ball.radius <= pBox.bottom &&
        ball.y + ball.radius >= pBox.top
      ) {
        // Colisión válida confirmada
        ball.y = pBox.top - ball.radius; // Corregir penetración

        // Calcular ángulo de rebote según el punto de impacto
        const relativeHit = (ball.x - this.player.x) / (this.player.width / 2);
        const clampedHit = Math.max(-1, Math.min(1, relativeHit));
        const bounceAngle = clampedHit * CONFIG.BALL.MAX_BOUNCE_ANGLE;

        // Aumentar velocidad progresivamente respetando límite
        ball.speed = Math.min(CONFIG.BALL.MAX_SPEED, ball.speed + CONFIG.BALL.SPEED_INCREMENT);

        // Desviar hacia arriba (hacia Flora)
        ball.vx = Math.sin(bounceAngle) * ball.speed;
        ball.vy = -Math.cos(bounceAngle) * ball.speed;

        // Efectos y animaciones
        this.player.triggerHitAnimation();
        this.rallyCount++;
        if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;

        // Calcular combo actual
        const comboEntry = CONFIG.SCORE.COMBO_THRESHOLDS.find(t => this.rallyCount >= t.hits);
        this.currentMultiplier = comboEntry ? comboEntry.multiplier : 1;
        if (this.currentMultiplier > this.maxCombo) this.maxCombo = this.currentMultiplier;

        // Sumar puntuación
        const pointsWon = CONFIG.SCORE.PADDLE_HIT * this.currentMultiplier;
        this.score += pointsWon;

        soundManager.playIgneoHit(1 + Math.min(0.5, this.rallyCount * 0.03));
        particleSystem.addImpactSparks(ball.x, ball.y, 22, true);
        particleSystem.addFloatingText(
          this.currentMultiplier > 1 ? `+${pointsWon} (x${this.currentMultiplier})` : `+${pointsWon}`,
          ball.x, ball.y + 35,
          this.currentMultiplier > 1 ? '#ffeb3b' : '#ff9100'
        );

        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.currentMultiplier);

        // Notificar a Flora del nuevo trayecto
        this.bot.onBallDirectionChangedToFlora(this.rallyCount);
        return;
      }
    }

    // C. Colisión con la paleta de FLORA (Parte Superior - Bot)
    if (ball.vy < 0) {
      const fBox = this.bot.getHitbox();
      if (
        ball.x + ball.radius >= fBox.left &&
        ball.x - ball.radius <= fBox.right &&
        ball.y + ball.radius >= fBox.top &&
        ball.y - ball.radius <= fBox.bottom
      ) {
        ball.y = fBox.bottom + ball.radius; // Corregir penetración

        const relativeHit = (ball.x - this.bot.x) / (this.bot.width / 2);
        const clampedHit = Math.max(-1, Math.min(1, relativeHit));
        const bounceAngle = clampedHit * CONFIG.BALL.MAX_BOUNCE_ANGLE;

        ball.speed = Math.min(CONFIG.BALL.MAX_SPEED, ball.speed + CONFIG.BALL.SPEED_INCREMENT);

        // Desviar hacia abajo (hacia Ígneo)
        ball.vx = Math.sin(bounceAngle) * ball.speed;
        ball.vy = Math.cos(bounceAngle) * ball.speed;

        this.bot.triggerHitAnimation();
        soundManager.playFloraHit(1 + Math.min(0.4, this.rallyCount * 0.02));
        particleSystem.addImpactSparks(ball.x, ball.y, 18, false);
        return;
      }
    }

    // D. FALLO DE FLORA (La bola supera la línea superior de la arena)
    if (ball.y < -20) {
      this._onFloraMiss();
      return;
    }

    // E. FALLO DE ÍGNEO (La bola supera la línea inferior de la arena)
    if (ball.y > CONFIG.COURT.HEIGHT + 20) {
      this._onIgneoMiss();
      return;
    }
  }

  _onIgneoMiss() {
    this.lives--;
    this.triggerScreenShake(12, 0.35);
    this.player.triggerShockedAnimation();
    soundManager.playLifeLost();

    // Resetear racha de combo
    this.rallyCount = 0;
    this.currentMultiplier = 1;

    if (this.onLivesUpdate) this.onLivesUpdate(this.lives);
    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.currentMultiplier);

    // Comprobar si se agotaron las tres vidas
    if (this.lives <= 0) {
      this._triggerGameOver();
    } else {
      // Pausa breve obligatoria y reinicio de posición de bola
      this.pauseTimer = CONFIG.TIMINGS.LIFE_LOST_PAUSE;
      this.pauseReason = 'life_lost';
      this._resetBall(true); // Se sirve de nuevo hacia Flora

      if (this.onNotification) {
        this.onNotification(`¡CUIDADO! TE QUEDAN ${this.lives} ${this.lives === 1 ? 'VIDA' : 'VIDAS'}`);
      }
    }
  }

  _onFloraMiss() {
    // Flora no alcanzó la bola: ¡Punto a favor de Ígneo!
    this.score += CONFIG.SCORE.FLORA_PASS;
    this.botLives--;
    this.bot.triggerMissAnimation();
    this.player.triggerCheerAnimation();
    soundManager.playScoreBonus();

    particleSystem.addFloatingText(`¡PUNTO! +${CONFIG.SCORE.FLORA_PASS}`, CONFIG.COURT.WIDTH / 2, CONFIG.COURT.HEIGHT / 2, '#69f0ae', 26);

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.currentMultiplier);
    if (this.onBotLivesUpdate) this.onBotLivesUpdate(this.botLives);

    if (this.botLives <= 0) {
      this._triggerGameOver(true);
      return;
    }

    this.round++;
    this.bot.setRound(this.round);
    if (this.onRoundUpdate) this.onRoundUpdate(this.round);
    if (this.onNotification) this.onNotification(`¡RONDA ${this.round}! FLORA SE VUELVE MÁS RÁPIDA`);

    // Pausa breve de celebración y nuevo saque
    this.pauseTimer = CONFIG.TIMINGS.GOAL_SCORED_PAUSE;
    this.pauseReason = 'goal';
    this._resetBall(false); // Se sirve hacia Ígneo más rápido en cada ronda
  }

  _triggerGameOver(won = false) {
    this.isRunning = false;
    soundManager.stopAmbient();
    soundManager.playGameOver();

    // Guardar resultado de partida de forma persistente
    const result = storageManager.saveScore(this.playerName, this.score, this.maxRally, this.maxCombo);

    if (result.isNewHighScore) {
      soundManager.playNewRecord();
    }

    if (this.onGameOver) {
      this.onGameOver({
        playerName: this.playerName,
        score: this.score,
        maxRally: this.maxRally,
        maxCombo: this.maxCombo,
        won,
        isNewHighScore: result.isNewHighScore,
        rank: result.rank
      });
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Aplicar sacudida de pantalla si está activa
    if (this.shakeIntensity > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(offsetX, offsetY);
    }

    // 2. Fondo de Arena Volcánica
    this._renderVolcanicArena(ctx);

    // 3. Renderizar partículas
    particleSystem.render(ctx);

    // 4. Renderizar personajes
    this.player.render(ctx);
    this.bot.render(ctx);

    // 5. Renderizar bola de energía roja
    this.ball.render(ctx);

    // 6. Mensaje en pantalla de saque
    if (this.pauseTimer > 0 && this.isRunning) {
      this._renderServeCountdown(ctx);
    }

    ctx.restore();
  }

  _renderVolcanicArena(ctx) {
    const w = CONFIG.COURT.WIDTH;
    const h = CONFIG.COURT.HEIGHT;

    // Suelo de basalto volcánico oscuro
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1c0a07');
    bgGrad.addColorStop(0.3, '#120504');
    bgGrad.addColorStop(0.7, '#120504');
    bgGrad.addColorStop(1, '#180a06');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Líneas laterales de lava incandescente
    const lavaGrad = ctx.createLinearGradient(0, 0, 24, 0);
    lavaGrad.addColorStop(0, 'rgba(255, 61, 0, 0.7)');
    lavaGrad.addColorStop(0.6, 'rgba(213, 0, 0, 0.3)');
    lavaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, 0, 24, h); // Borde izquierdo

    const lavaRightGrad = ctx.createLinearGradient(w, 0, w - 24, 0);
    lavaRightGrad.addColorStop(0, 'rgba(255, 61, 0, 0.7)');
    lavaRightGrad.addColorStop(0.6, 'rgba(213, 0, 0, 0.3)');
    lavaRightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lavaRightGrad;
    ctx.fillRect(w - 24, 0, 24, h); // Borde derecho

    // Grietas y marcas del centro de la arena
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(28, h / 2);
    ctx.lineTo(w - 28, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Círculo central de la arena volcánica
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Símbolo de llama en el centro
    ctx.fillStyle = 'rgba(255, 110, 64, 0.15)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderServeCountdown(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, CONFIG.COURT.WIDTH, CONFIG.COURT.HEIGHT);

    ctx.font = '900 36px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = '#ff3d00';
    ctx.shadowBlur = 18;

    const label = this.pauseReason === 'life_lost' ? '¡PREPÁRATE!' : '¡LISTOS!';
    ctx.fillText(label, CONFIG.COURT.WIDTH / 2, CONFIG.COURT.HEIGHT / 2);
    ctx.restore();
  }
}
