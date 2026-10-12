/**
 * ÍGNEO: PONG DE FUEGO - Controlador Principal de la Aplicación (UI & Estado)
 * Conecta las pantallas, eventos, HUD y flujo general del juego.
 */

class AppController {
  constructor() {
    this.gameEngine = null;

    // Elementos del DOM
    this.screens = {
      start: null,
      gameplay: null,
      gameOver: null,
      leaderboard: null
    };

    this.modals = {
      pause: null
    };

    this.inputs = {
      playerName: null
    };

    this.buttons = {
      playStart: null,
      leaderboardStart: null,
      pauseToggle: null,
      resumePause: null,
      quitPause: null,
      muteToggle: null,
      playAgain: null,
      leaderboardResult: null,
      menuResult: null,
      backLeaderboard: null
    };

    this.hud = {
      score: null,
      multiplier: null,
      playerName: null,
      lives: []
    };

    this.hud.botLives = [];
    this.hud.round = null;

    this.results = {
      score: null,
      rally: null,
      combo: null,
      newRecordBadge: null
    };

    this.containers = {
      leaderboard: null,
      floatingBanner: null
    };
  }

  async init() {
    // 1. Obtener referencias de elementos HTML
    this.screens.start = document.getElementById('screen-start');
    this.screens.gameplay = document.getElementById('screen-gameplay');
    this.screens.gameOver = document.getElementById('screen-gameover');
    this.screens.leaderboard = document.getElementById('screen-leaderboard');

    this.modals.pause = document.getElementById('modal-pause');

    this.inputs.playerName = document.getElementById('player-name-input');

    this.buttons.playStart = document.getElementById('btn-play-start');
    this.buttons.leaderboardStart = document.getElementById('btn-leaderboard-start');
    this.buttons.pauseToggle = document.getElementById('btn-pause-toggle');
    this.buttons.resumePause = document.getElementById('btn-resume-pause');
    this.buttons.quitPause = document.getElementById('btn-quit-pause');
    this.buttons.muteToggle = document.getElementById('btn-mute-toggle');
    this.buttons.playAgain = document.getElementById('btn-play-again');
    this.buttons.leaderboardResult = document.getElementById('btn-leaderboard-result');
    this.buttons.menuResult = document.getElementById('btn-menu-result');
    this.buttons.backLeaderboard = document.getElementById('btn-back-leaderboard');

    this.hud.score = document.getElementById('hud-score');
    this.hud.multiplier = document.getElementById('hud-multiplier');
    this.hud.playerName = document.getElementById('hud-player-name');
    this.hud.lives = [
      document.getElementById('life-1'),
      document.getElementById('life-2'),
      document.getElementById('life-3')
    ];
    this.hud.botLives = [
      document.getElementById('bot-life-1'),
      document.getElementById('bot-life-2'),
      document.getElementById('bot-life-3')
    ];
    this.hud.round = document.getElementById('hud-round');

    this.results.score = document.getElementById('result-score-val');
    this.results.rally = document.getElementById('result-rally-val');
    this.results.combo = document.getElementById('result-combo-val');
    this.results.newRecordBadge = document.getElementById('result-new-record');
    this.results.title = document.getElementById('result-title');
    this.results.subtitle = document.getElementById('result-subtitle');

    this.containers.leaderboard = document.getElementById('leaderboard-list-container');
    this.containers.floatingBanner = document.getElementById('floating-banner');

    // 2. Prellenar nombre del jugador si ya existe en la colección
    const storedName = storageManager.getStoredPlayerName();
    if (storedName && this.inputs.playerName) {
      this.inputs.playerName.value = storedName;
    }

    // 3. Cargar imágenes de assets oficiales
    await assetManager.loadAll();

    // 4. Inicializar motor del juego
    const canvas = document.getElementById('pong-canvas');
    this.gameEngine = new GameEngine(canvas);

    // Callbacks del motor hacia la UI
    this.gameEngine.onScoreUpdate = (score, multiplier) => this._updateHudScore(score, multiplier);
    this.gameEngine.onLivesUpdate = (lives) => this._updateHudLives(lives);
    this.gameEngine.onBotLivesUpdate = (lives) => this._updateHudBotLives(lives);
    this.gameEngine.onRoundUpdate = (round) => {
      if (this.hud.round) this.hud.round.textContent = `${round}/3`;
    };
    this.gameEngine.onGameOver = (summary) => this._showGameOverScreen(summary);
    this.gameEngine.onNotification = (msg) => this._showFloatingBanner(msg);

    // 5. Vincular eventos de botones
    this._bindEvents();

    // Actualizar botón de silencio inicial
    this._updateMuteButtonVisual();
  }

  _bindEvents() {
    // A. Botón "JUGAR" desde el menú de inicio
    this.buttons.playStart.addEventListener('click', () => {
      soundManager.playClick();
      const name = this.inputs.playerName.value.trim() || 'ÍGNEO';
      storageManager.setPlayerName(name);
      this._startGame(name);
    });

    // Enter en input de nombre inicia el juego
    this.inputs.playerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.buttons.playStart.click();
      }
    });

    // B. Botón "MEJORES PUNTAJES" desde inicio
    this.buttons.leaderboardStart.addEventListener('click', () => {
      soundManager.playClick();
      this._showLeaderboardScreen('start');
    });

    // C. Pausa
    this.buttons.pauseToggle.addEventListener('click', () => {
      soundManager.playClick();
      this._pauseGame();
    });

    this.buttons.resumePause.addEventListener('click', () => {
      soundManager.playClick();
      this._resumeGame();
    });

    this.buttons.quitPause.addEventListener('click', () => {
      soundManager.playClick();
      this.gameEngine.stop();
      this.modals.pause.classList.add('hidden');
      this._showScreen('start');
    });

    // D. Silenciar / Activar Sonido
    this.buttons.muteToggle.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      this._updateMuteButtonVisual();
    });

    // E. Fin de partida
    this.buttons.playAgain.addEventListener('click', () => {
      soundManager.playClick();
      const name = storageManager.getStoredPlayerName() || 'ÍGNEO';
      this._startGame(name);
    });

    this.buttons.leaderboardResult.addEventListener('click', () => {
      soundManager.playClick();
      this._showLeaderboardScreen('gameover');
    });

    this.buttons.menuResult.addEventListener('click', () => {
      soundManager.playClick();
      this._showScreen('start');
    });

    // F. Volver desde la pantalla de clasificación
    this.buttons.backLeaderboard.addEventListener('click', () => {
      soundManager.playClick();
      const prevScreen = this.screens.leaderboard.getAttribute('data-origin') || 'start';
      this._showScreen(prevScreen === 'gameover' ? 'gameOver' : 'start');
    });
  }

  _showScreen(screenKey) {
    // Ocultar todas
    this.screens.start.classList.add('hidden');
    this.screens.gameplay.classList.add('hidden');
    this.screens.gameOver.classList.add('hidden');
    this.screens.leaderboard.classList.add('hidden');
    this.modals.pause.classList.add('hidden');

    // Mostrar deseada
    if (this.screens[screenKey]) {
      this.screens[screenKey].classList.remove('hidden');
    }
  }

  _startGame(playerName) {
    this._showScreen('gameplay');
    if (this.hud.playerName) {
      this.hud.playerName.textContent = playerName;
    }
    this._updateHudLives(CONFIG.LIVES.INITIAL);
    this._updateHudBotLives(CONFIG.LIVES.INITIAL);
    if (this.hud.round) this.hud.round.textContent = '1/3';
    this.gameEngine.startNewGame(playerName);
  }

  _pauseGame() {
    this.gameEngine.setPaused(true);
    this.modals.pause.classList.remove('hidden');
  }

  _resumeGame() {
    this.modals.pause.classList.add('hidden');
    this.gameEngine.setPaused(false);
  }

  _updateHudScore(score, multiplier) {
    if (this.hud.score) {
      this.hud.score.textContent = score;
    }
    if (this.hud.multiplier) {
      this.hud.multiplier.textContent = `x${multiplier}`;
      if (multiplier > 1) {
        this.hud.multiplier.classList.add('active');
      } else {
        this.hud.multiplier.classList.remove('active');
      }
    }
  }

  _updateHudLives(lives) {
    // Actualizar exactamente 3 llamas visuales
    for (let i = 0; i < 3; i++) {
      const flame = this.hud.lives[i];
      if (flame) {
        if (i < lives) {
          flame.classList.remove('lost');
        } else {
          flame.classList.add('lost');
        }
      }
    }
  }

  _updateHudBotLives(lives) {
    for (let i = 0; i < this.hud.botLives.length; i++) {
      const leaf = this.hud.botLives[i];
      if (leaf) leaf.classList.toggle('lost', i >= lives);
    }
  }

  _showFloatingBanner(message) {
    if (!this.containers.floatingBanner) return;
    if (message) {
      this.containers.floatingBanner.textContent = message;
      this.containers.floatingBanner.classList.add('show');
    } else {
      this.containers.floatingBanner.classList.remove('show');
    }
  }

  _showGameOverScreen(summary) {
    this._showScreen('gameOver');

    if (this.results.title) this.results.title.textContent = summary.won ? '¡Victoria!' : '¡Fin de la partida!';
    if (this.results.subtitle) {
      this.results.subtitle.textContent = summary.won ? 'Flora perdió sus tres vidas' : 'Tus tres llamas se han extinguido';
    }

    if (this.results.score) this.results.score.textContent = summary.score;
    if (this.results.rally) this.results.rally.textContent = summary.maxRally;
    if (this.results.combo) this.results.combo.textContent = `x${summary.maxCombo}`;

    if (this.results.newRecordBadge) {
      if (summary.isNewHighScore) {
        this.results.newRecordBadge.classList.remove('hidden');
      } else {
        this.results.newRecordBadge.classList.add('hidden');
      }
    }
  }

  _showLeaderboardScreen(originScreen = 'start') {
    this.screens.leaderboard.setAttribute('data-origin', originScreen);
    storageManager.renderLeaderboard(this.containers.leaderboard);
    this._showScreen('leaderboard');
  }

  _updateMuteButtonVisual() {
    if (!this.buttons.muteToggle) return;
    const isMuted = soundManager.isMuted;
    this.buttons.muteToggle.innerHTML = isMuted ? '🔇' : '🔊';
    this.buttons.muteToggle.title = isMuted ? 'Activar sonido' : 'Silenciar sonido';
  }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
