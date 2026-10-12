/**
 * ÍGNEO: PONG DE FUEGO - Configuración y Constantes del Juego
 * Colección Transmedia: Flora, Polo e Ígneo
 */

const CONFIG = {
  // Dimensiones virtuales del campo de juego (Lógica interna)
  COURT: {
    WIDTH: 600,
    HEIGHT: 850,
    ASPECT_RATIO: 600 / 850
  },

  // Sistema de Vidas (Exactamente 3 por partida, obligatorio)
  LIVES: {
    INITIAL: 3,
    MAX: 3
  },

  // Ígneo (Jugador - Parte Inferior)
  IGNEO: {
    PADDLE_WIDTH: 115,
    VISUAL_HEIGHT: 120,
    Y_CENTER: 770, // Distancia desde la parte inferior
    MOVE_SPEED: 560, // Velocidad máxima con teclado (px/s)
    ACCELERATION: 3600,
    FRICTION: 0.82,
    HITBOX_HEIGHT: 26,
    HITBOX_Y_OFFSET: -36 // Zona de impacto hacia el centro de la arena
  },

  // Flora (Bot / Oponente - Parte Superior)
  FLORA: {
    PADDLE_WIDTH: 115,
    VISUAL_HEIGHT: 120,
    Y_CENTER: 80, // Distancia desde la parte superior
    MOVE_SPEED: 410, // Velocidad limitada (dificultad media balanceada)
    REACTION_DELAY: 0.12, // Retardo de reacción en segundos
    SMOOTHING: 0.14, // Suavizado de seguimiento
    ERROR_MARGIN_MAX: 28, // Margen de error en píxeles para permitir fallos realistas
    HITBOX_HEIGHT: 26,
    HITBOX_Y_OFFSET: 36 // Zona de impacto hacia el centro de la arena
  },

  // Bola de Energía Roja
  BALL: {
    RADIUS: 11,
    INITIAL_SPEED: 420, // Velocidad moderada al inicio
    SPEED_INCREMENT: 16, // Aumento gradual por rebote
    SPEED_RAMP_PER_SECOND: 10, // Aumento continuo mientras la bola está en juego
    MAX_SPEED: 760, // Límite máximo para mantener el juego jugable
    MAX_BOUNCE_ANGLE: 58 * (Math.PI / 180), // Ángulo máximo de rebote (58 grados)
    MIN_VERTICAL_SPEED_RATIO: 0.35 // Garantiza que no se mueva puramente horizontal
  },

  // Sistema de Puntuación
  SCORE: {
    PADDLE_HIT: 10, // Puntos base por devolución válida de Ígneo
    FLORA_PASS: 50, // Puntos extra cuando Flora no consigue devolver la bola
    COMBO_THRESHOLDS: [
      { hits: 12, multiplier: 4 },
      { hits: 7, multiplier: 3 },
      { hits: 4, multiplier: 2 },
      { hits: 0, multiplier: 1 }
    ]
  },

  // Tiempos y Pausas
  TIMINGS: {
    SERVE_DELAY: 1.1, // Pausa breve antes de poner la bola en juego (segundos)
    LIFE_LOST_PAUSE: 1.3, // Pausa tras perder una vida
    GOAL_SCORED_PAUSE: 1.0 // Pausa tras anotar punto superando a Flora
  },

  // Almacenamiento Local (Persistencia)
  STORAGE: {
    KEY_LEADERBOARD: 'igneo_pong_leaderboard_v1',
    KEY_PLAYER_NAME: 'igneo_ultimo_nombre_jugador',
    MAX_LEADERBOARD_ENTRIES: 10,
    
    // Claves de los otros juegos de la colección para reutilizar el nombre
    CROSS_KEYS_PLAYER_NAME: [
      'igneo_ultimo_nombre_jugador',
      'flora_ultimo_nombre_jugador',
      'polo_player_name',
      'transmedia_player_name'
    ]
  }
};

// Congelar configuración para prevenir mutaciones involuntarias
Object.freeze(CONFIG);
Object.freeze(CONFIG.COURT);
Object.freeze(CONFIG.LIVES);
Object.freeze(CONFIG.IGNEO);
Object.freeze(CONFIG.FLORA);
Object.freeze(CONFIG.BALL);
Object.freeze(CONFIG.SCORE);
Object.freeze(CONFIG.TIMINGS);
Object.freeze(CONFIG.STORAGE);
