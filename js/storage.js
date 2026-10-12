/**
 * ÍGNEO: PONG DE FUEGO - Administrador de Persistencia y Clasificación
 * Maneja el guardado de mejores puntajes y reutiliza el nombre del jugador
 * de la colección transmedia (Flora, Polo, Ígneo).
 */

class StorageManager {
  constructor() {
    this.storageKey = CONFIG.STORAGE.KEY_LEADERBOARD;
    this.nameKey = CONFIG.STORAGE.KEY_PLAYER_NAME;
  }

  /**
   * Obtiene la lista de puntuaciones ordenada de mayor a menor
   * Regla obligatoria: No se generan jugadores inventados si está vacío.
   */
  getLeaderboard() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];

      return list
        .filter(item => item && typeof item.score === 'number' && item.name)
        .sort((a, b) => b.score - a.score)
        .slice(0, CONFIG.STORAGE.MAX_LEADERBOARD_ENTRIES);
    } catch (e) {
      console.warn('Error al leer el ranking en localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda un nuevo puntaje garantizando no duplicar partidas
   */
  saveScore(name, score, rallyMax = 0, bestCombo = 1) {
    const cleanName = (name || '').trim().toUpperCase();
    if (!cleanName || typeof score !== 'number' || score < 0) {
      return { success: false, message: 'Nombre o puntuación no válidos.' };
    }

    try {
      const currentList = this.getLeaderboard();
      const topBefore = currentList.length > 0 ? currentList[0].score : 0;
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateFormatted = `${day}/${month}/${year}`;

      const newEntry = {
        name: cleanName,
        score: Math.floor(score),
        rallyMax: Math.floor(rallyMax),
        bestCombo: Math.floor(bestCombo),
        date: dateFormatted,
        timestamp: Date.now()
      };

      currentList.push(newEntry);
      currentList.sort((a, b) => b.score - a.score);

      const trimmed = currentList.slice(0, CONFIG.STORAGE.MAX_LEADERBOARD_ENTRIES);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));

      // Guardar también como último nombre activo para futuros juegos
      this.setPlayerName(cleanName);

      const rank = trimmed.findIndex(e => e.timestamp === newEntry.timestamp) + 1;
      const isNewHighScore = score > topBefore;

      return {
        success: true,
        rank: rank > 0 ? rank : null,
        isNewHighScore: isNewHighScore,
        entry: newEntry
      };
    } catch (e) {
      console.error('Error al guardar puntaje en localStorage:', e);
      return { success: false, message: 'Error de almacenamiento en el navegador.' };
    }
  }

  /**
   * Obtiene el último nombre de jugador registrado, revisando primero
   * este juego y luego los juegos de la colección (Flora y Polo)
   */
  getStoredPlayerName() {
    for (const key of CONFIG.STORAGE.CROSS_KEYS_PLAYER_NAME) {
      const stored = localStorage.getItem(key);
      if (stored && stored.trim()) {
        return stored.trim().toUpperCase();
      }
    }
    return '';
  }

  /**
   * Guarda el nombre para este juego y sincroniza la clave compartida
   */
  setPlayerName(name) {
    if (!name || !name.trim()) return;
    const clean = name.trim().toUpperCase();
    localStorage.setItem(this.nameKey, clean);
    localStorage.setItem('transmedia_player_name', clean);
  }

  /**
   * Renderiza la tabla de posiciones en el contenedor especificado
   */
  renderLeaderboard(container) {
    if (!container) return;
    const list = this.getLeaderboard();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-leaderboard">
          <div class="empty-icon">🔥</div>
          <p>Aún no hay puntuaciones registradas.</p>
          <small>¡Sé el primero en dominar la arena de fuego!</small>
        </div>
      `;
      return;
    }

    let rowsHtml = '';
    list.forEach((item, index) => {
      const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
      const isTop = index === 0 ? 'rank-top' : '';
      rowsHtml += `
        <tr class="${isTop}">
          <td class="rank-col">${rankBadge}</td>
          <td>${this._escapeHtml(item.name)}</td>
          <td class="score-col">${item.score} pts</td>
          <td class="date-col">${item.date}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Jugador</th>
            <th style="text-align: right;">Puntaje</th>
            <th style="text-align: right;">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const storageManager = new StorageManager();
