/**
 * ÍGNEO: PONG DE FUEGO - Inteligencia Artificial de Flora (Bot)
 * Dificultad media, orgánica y progresiva con limitaciones calculadas
 * para garantizar partidas justas y dinámicas.
 */

class FloraBot {
  constructor() {
    this.width = CONFIG.FLORA.PADDLE_WIDTH;
    this.visualHeight = CONFIG.FLORA.VISUAL_HEIGHT;
    this.hitboxHeight = CONFIG.FLORA.HITBOX_HEIGHT;
    this.x = CONFIG.COURT.WIDTH / 2;
    this.y = CONFIG.FLORA.Y_CENTER;
    
    this.targetX = this.x;
    this.errorOffset = 0;
    this.reactionTimer = 0;
    this.hitAnimationTimer = 0;
    this.missAnimationTimer = 0;
    this.round = 1;
    this.moveSpeed = CONFIG.FLORA.MOVE_SPEED;
    this.reactionDelay = CONFIG.FLORA.REACTION_DELAY;
    this.errorMarginMax = CONFIG.FLORA.ERROR_MARGIN_MAX;
    
    this.state = 'idle'; // 'idle', 'move_left', 'move_right', 'hit', 'shocked'
  }

  reset() {
    this.x = CONFIG.COURT.WIDTH / 2;
    this.targetX = this.x;
    this.errorOffset = 0;
    this.reactionTimer = 0;
    this.hitAnimationTimer = 0;
    this.missAnimationTimer = 0;
    this.state = 'idle';
    this.setRound(1);
  }

  setRound(round) {
    this.round = round;
    const difficultyStep = round - 1;
    this.moveSpeed = CONFIG.FLORA.MOVE_SPEED * (1 + difficultyStep * 0.22);
    this.reactionDelay = Math.max(0.04, CONFIG.FLORA.REACTION_DELAY - difficultyStep * 0.035);
    this.errorMarginMax = Math.max(8, CONFIG.FLORA.ERROR_MARGIN_MAX - difficultyStep * 8);
  }

  onBallDirectionChangedToFlora(rallyCount = 0) {
    // Calcular un error humano intencional de anticipación
    // A mayor rally, el error se reduce moderadamente
    const maxError = Math.max(6, this.errorMarginMax - Math.min(16, rallyCount * 1.5));
    this.errorOffset = (Math.random() - 0.5) * (maxError * 2);
    this.reactionTimer = this.reactionDelay;
  }

  triggerHitAnimation() {
    this.hitAnimationTimer = 0.35;
    this.state = 'hit';
  }

  triggerMissAnimation() {
    this.missAnimationTimer = 1.0;
    this.state = 'shocked';
  }

  update(dt, ball, rallyCount) {
    // 1. Manejo de animaciones temporales
    if (this.hitAnimationTimer > 0) {
      this.hitAnimationTimer -= dt;
      if (this.hitAnimationTimer <= 0 && this.missAnimationTimer <= 0) {
        this.state = 'idle';
      }
    }

    if (this.missAnimationTimer > 0) {
      this.missAnimationTimer -= dt;
      if (this.missAnimationTimer <= 0) {
        this.state = 'idle';
      }
      return; // En estado de shock por fallo, no se mueve
    }

    // 2. Lógica de seguimiento de la bola
    const isBallApproaching = ball.vy > 0;

    if (isBallApproaching) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        // Flora apunta a la bola con su margen de error humano
        this.targetX = ball.x + this.errorOffset;
        this.reactionTimer = Math.max(0.035, this.reactionDelay * 0.67);
      }
    } else {
      // Cuando la bola va hacia Ígneo, Flora regresa suavemente hacia el centro
      this.targetX = CONFIG.COURT.WIDTH / 2;
    }

    // 3. Movimiento con limitación estricta de velocidad
    const dx = this.targetX - this.x;
    const distance = Math.abs(dx);
    const speedLimit = this.moveSpeed;

    if (distance > 4) {
      const step = Math.min(distance, speedLimit * dt);
      const dir = Math.sign(dx);
      this.x += dir * step;

      if (this.hitAnimationTimer <= 0) {
        this.state = dir > 0 ? 'move_right' : 'move_left';
      }
    } else {
      if (this.hitAnimationTimer <= 0) {
        this.state = 'idle';
      }
    }

    // 4. Limitar a los márgenes de la arena volcánica
    const halfWidth = this.width / 2;
    const minX = 24 + halfWidth;
    const maxX = CONFIG.COURT.WIDTH - 24 - halfWidth;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  /**
   * Obtiene la caja de colisión superior de Flora para devolver la bola
   */
  getHitbox() {
    const hitboxY = this.y + CONFIG.FLORA.HITBOX_Y_OFFSET;
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

    const sprite = assetManager.getFloraSprite(this.state);
    let renderW = this.width;
    let renderH = this.visualHeight;

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      renderH = this.visualHeight;
      renderW = renderH * aspect;
    }

    const drawX = this.x - renderW / 2;
    const drawY = this.y - renderH / 2;

    // Sombra botánica suave en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + renderH / 2 - 4, renderW * 0.45, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura natural sutil
    const aura = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, renderW * 0.65);
    aura.addColorStop(0, 'rgba(76, 175, 80, 0.25)');
    aura.addColorStop(1, 'rgba(76, 175, 80, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(this.x, this.y, renderW * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar sprite de Flora en alta definición manteniendo proporción
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, drawX, drawY, renderW, renderH);
    } else {
      // Respaldo estilizado
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, renderW, renderH, 16);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#81c784';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Flora', this.x, this.y + 6);
    }

    // Indicador sutil de energía vegetal en la zona de contacto
    const hitY = this.y + CONFIG.FLORA.HITBOX_Y_OFFSET;
    const hitGrad = ctx.createLinearGradient(this.x - this.width / 2, hitY, this.x + this.width / 2, hitY);
    hitGrad.addColorStop(0, 'rgba(76, 175, 80, 0)');
    hitGrad.addColorStop(0.5, 'rgba(129, 199, 132, 0.55)');
    hitGrad.addColorStop(1, 'rgba(76, 175, 80, 0)');
    ctx.fillStyle = hitGrad;
    ctx.fillRect(this.x - this.width / 2, hitY - 2, this.width, 4);

    ctx.restore();
  }
}
