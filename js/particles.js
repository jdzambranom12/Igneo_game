/**
 * ÍGNEO: PONG DE FUEGO - Sistema de Partículas y Efectos Visuales
 * Renderiza brasas volcánicas, estela de la bola de energía roja y chispas de impacto.
 */

class ParticleSystem {
  constructor() {
    this.ambientEmbers = [];
    this.ballTrail = [];
    this.sparks = [];
    this.floatingTexts = [];
    this.maxEmbers = 45;
  }

  init(courtWidth, courtHeight) {
    this.ambientEmbers = [];
    for (let i = 0; i < this.maxEmbers; i++) {
      this.ambientEmbers.push(this._createEmber(courtWidth, courtHeight, true));
    }
  }

  _createEmber(w, h, randomY = false) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 10,
      vx: (Math.random() - 0.5) * 20,
      vy: -(25 + Math.random() * 45),
      size: 1.5 + Math.random() * 2.8,
      alpha: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.4 ? '#ff5722' : Math.random() > 0.5 ? '#ffab00' : '#d50000',
      oscillationSpeed: 1 + Math.random() * 2,
      oscillationAmp: 10 + Math.random() * 15,
      time: Math.random() * 10
    };
  }

  /**
   * Añade una partícula a la estela de fuego de la bola roja
   */
  addBallTrail(x, y, radius) {
    this.ballTrail.push({
      x: x + (Math.random() - 0.5) * (radius * 0.4),
      y: y + (Math.random() - 0.5) * (radius * 0.4),
      radius: radius * (0.6 + Math.random() * 0.35),
      alpha: 0.75,
      life: 0.24, // Segundos de vida
      maxLife: 0.24,
      color: Math.random() > 0.3 ? '#ff3d00' : '#ff9100'
    });
  }

  /**
   * Explosión de chispas en impacto
   */
  addImpactSparks(x, y, count = 16, isIgneo = true) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        color: isIgneo 
          ? (Math.random() > 0.4 ? '#ffeb3b' : Math.random() > 0.5 ? '#ff3d00' : '#ff9100')
          : (Math.random() > 0.5 ? '#81c784' : '#ffd54f')
      });
    }
  }

  /**
   * Texto flotante emergente (+10, +50, etc.)
   */
  addFloatingText(text, x, y, color = '#ffeb3b', size = 20) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -60,
      alpha: 1,
      life: 0.85,
      maxLife: 0.85,
      color: color,
      size: size
    });
  }

  update(dt, courtWidth, courtHeight) {
    // 1. Brasas ambientales
    for (let i = 0; i < this.ambientEmbers.length; i++) {
      const e = this.ambientEmbers[i];
      e.time += dt;
      e.y += e.vy * dt;
      e.x += (e.vx + Math.sin(e.time * e.oscillationSpeed) * e.oscillationAmp) * dt;

      if (e.y < -10 || e.x < -20 || e.x > courtWidth + 20) {
        this.ambientEmbers[i] = this._createEmber(courtWidth, courtHeight, false);
      }
    }

    // 2. Estela de la bola
    for (let i = this.ballTrail.length - 1; i >= 0; i--) {
      const t = this.ballTrail[i];
      t.life -= dt;
      t.alpha = (t.life / t.maxLife) * 0.75;
      t.radius *= 0.94;
      if (t.life <= 0) {
        this.ballTrail.splice(i, 1);
      }
    }

    // 3. Chispas de impacto
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 120 * dt; // Gravedad leve
      s.alpha = s.life / s.maxLife;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // 4. Textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.alpha = ft.life / ft.maxLife;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Dibujar estela de bola
    for (const t of this.ballTrail) {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar brasas ambientales
    for (const e of this.ambientEmbers) {
      ctx.globalAlpha = Math.max(0, e.alpha);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar chispas
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar textos flotantes
    ctx.font = 'bold 20px Poppins, sans-serif';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }
}

const particleSystem = new ParticleSystem();
