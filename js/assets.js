/**
 * ÍGNEO: PONG DE FUEGO - Gestor de Recursos Gráficos y Sprites
 * Carga las ilustraciones oficiales de Ígneo y Flora con soporte para poses.
 */

class AssetManager {
  constructor() {
    this.sprites = {
      igneo: {
        idle: null,
        run: null,
        jump: null,
        spin: null,
        shocked: null,
        point: null,
        hero: null
      },
      flora: {
        idle: null,
        run: null,
        jump: null,
        cheer: null,
        shocked: null,
        side: null
      }
    };

    this.isLoaded = false;
  }

  async loadAll() {
    const assetManifest = [
      // Ígneo (Jugador)
      { key: 'igneo.idle', src: 'assets/igneo/igneo_idle.png' },
      { key: 'igneo.run', src: 'assets/igneo/igneo_run.png' },
      { key: 'igneo.jump', src: 'assets/igneo/igneo_jump.png' },
      { key: 'igneo.spin', src: 'assets/igneo/igneo_spin.png' },
      { key: 'igneo.shocked', src: 'assets/igneo/igneo_shocked.png' },
      { key: 'igneo.point', src: 'assets/igneo/igneo_point.png' },
      { key: 'igneo.hero', src: 'assets/igneo/igneo_hero.png' },

      // Flora (Oponente Bot)
      { key: 'flora.idle', src: 'assets/flora/flora_idle.png' },
      { key: 'flora.run', src: 'assets/flora/flora_run.png' },
      { key: 'flora.jump', src: 'assets/flora/flora_jump.png' },
      { key: 'flora.cheer', src: 'assets/flora/flora_cheer.png' },
      { key: 'flora.shocked', src: 'assets/flora/flora_shocked.png' },
      { key: 'flora.side', src: 'assets/flora/flora_side.png' }
    ];

    const promises = assetManifest.map(item => this._loadImage(item.key, item.src));
    await Promise.allSettled(promises);
    this.isLoaded = true;
    console.log('Recursos visuales de Ígneo y Flora procesados exitosamente.');
  }

  _loadImage(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this._setNestedProperty(this.sprites, key, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`No se pudo cargar imagen en ${src}, usando renderizado de respaldo.`);
        resolve(null);
      };
      img.src = src;
    });
  }

  _setNestedProperty(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Obtiene el sprite adecuado para Ígneo según su estado actual
   */
  getIgneoSprite(state = 'idle') {
    switch (state) {
      case 'hit':
        return this.sprites.igneo.spin || this.sprites.igneo.hero || this.sprites.igneo.jump;
      case 'move_left':
      case 'move_right':
        return this.sprites.igneo.run || this.sprites.igneo.idle;
      case 'shocked':
        return this.sprites.igneo.shocked || this.sprites.igneo.idle;
      case 'cheer':
        return this.sprites.igneo.jump || this.sprites.igneo.point;
      case 'idle':
      default:
        return this.sprites.igneo.idle || this.sprites.igneo.run;
    }
  }

  /**
   * Obtiene el sprite adecuado para Flora según su estado actual
   */
  getFloraSprite(state = 'idle') {
    switch (state) {
      case 'hit':
        return this.sprites.flora.cheer || this.sprites.flora.jump;
      case 'move_left':
      case 'move_right':
        return this.sprites.flora.run || this.sprites.flora.idle;
      case 'shocked':
        return this.sprites.flora.shocked || this.sprites.flora.idle;
      case 'cheer':
        return this.sprites.flora.cheer || this.sprites.flora.jump;
      case 'idle':
      default:
        return this.sprites.flora.idle || this.sprites.flora.side;
    }
  }
}

const assetManager = new AssetManager();
