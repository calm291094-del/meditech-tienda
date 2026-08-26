// ═══════════════════════════════════════════════════════════
// 🌍 WORL KALM - UI SYSTEM
// Sistema de interfaz de usuario
// ═══════════════════════════════════════════════════════════

WK.UI = {
    bannerTimeout: null,
    notificationTimeout: null,

    // ═══════════════════════════════════════════════════════
    // MOSTRAR BANNER
    // ═══════════════════════════════════════════════════════
    showBanner: function(text, type = 'info') {
        let banner = document.getElementById('banner');
        if (!banner) return;

        banner.textContent = text;
        banner.className = 'show ' + type;

        if (this.bannerTimeout) {
            clearTimeout(this.bannerTimeout);
        }

        this.bannerTimeout = setTimeout(() => {
            banner.classList.remove('show');
        }, 3000);
    },

    // ═══════════════════════════════════════════════════════
    // MOSTRAR NOTIFICACIÓN
    // ═══════════════════════════════════════════════════════
    showNotification: function(text, type = 'info') {
        let notif = document.getElementById('notif');
        if (!notif) return;

        notif.textContent = text;
        notif.className = 'show ' + type;

        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        this.notificationTimeout = setTimeout(() => {
            notif.classList.remove('show');
        }, 2500);
    },

    // ═══════════════════════════════════════════════════════
    // ACTUALIZAR HUD
    // ═══════════════════════════════════════════════════════
    updateHUD: function() {
        let G = WK.Game;

        // Recursos
        document.getElementById('uFood').textContent = `🍎 ${Math.floor(G.stock.food)}`;
        document.getElementById('uWood').textContent = `🪵 ${Math.floor(G.stock.wood)}`;
        document.getElementById('uStone').textContent = `🪨 ${Math.floor(G.stock.stone)}`;
        document.getElementById('uGold').textContent = `🪙 ${Math.floor(G.stock.gold || 0)}`;
        document.getElementById('uFaith').textContent = `🕊️ ${Math.floor(G.stock.faith || 0)}`;
        document.getElementById('uKnow').textContent = `🧠 ${Math.floor(G.stock.knowledge || 0)}`;

        // Población
        document.getElementById('uPop').textContent = `👥 ${G.villagers.length}`;
        document.getElementById('uDog').textContent = `🐕 ${G.dogs.length}`;

        // Tiempo
        let day = Math.floor(G.day);
        let hour = Math.floor((G.timeOfDay * 24) % 24);
        let minute = Math.floor(((G.timeOfDay * 24) % 1) * 60);
        document.getElementById('uTime').textContent = `🕒 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        document.getElementById('uDay').textContent = `📅 Día ${day}`;

        // Clima
        let weatherIcon = '☀️';
        if (G.weather === 'rain') weatherIcon = '🌧️';
        else if (G.weather === 'storm') weatherIcon = '⛈️';
        document.getElementById('uWea').textContent = weatherIcon;

        // Estación
        let seasonIcon = '🌸';
        if (G.currentSeason === 1) seasonIcon = '☀️';
        else if (G.currentSeason === 2) seasonIcon = '🍂';
        else if (G.currentSeason === 3) seasonIcon = '❄️';
        document.getElementById('uSeas').textContent = seasonIcon;
    },

    // ═══════════════════════════════════════════════════════
    // MOSTRAR PANEL
    // ═══════════════════════════════════════════════════════
    showPanel: function(panelId) {
        let panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'flex';
        }
    },

    // ═══════════════════════════════════════════════════════
    // OCULTAR PANEL
    // ═══════════════════════════════════════════════════════
    hidePanel: function(panelId) {
        let panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
        }
    },

    // ═══════════════════════════════════════════════════════
    // TOGGLE PANEL
    // ═══════════════════════════════════════════════════════
    togglePanel: function(panelId) {
        let panel = document.getElementById(panelId);
        if (panel) {
            if (panel.style.display === 'flex') {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'flex';
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // RENDERIZAR MISIONES
    // ═══════════════════════════════════════════════════════
    renderQuests: function() {
        let panel = document.getElementById('questPanel');
        if (!panel) return;

        let content = panel.querySelector('.pc');
        if (!content) return;

        let activeQuests = WK.Quests.getActiveQuests();
        let completedQuests = WK.Quests.getCompletedQuests();

        let html = '<h3>📜 Misiones Activas</h3>';
        
        if (activeQuests.length === 0) {
            html += '<p style="color: var(--td);">No hay misiones activas</p>';
        } else {
            activeQuests.forEach(quest => {
                html += `
                    <div class="quest-card">
                        <div class="quest-icon">${quest.icon}</div>
                        <div class="quest-info">
                            <div class="quest-name">${quest.name}</div>
                            <div class="quest-desc">${quest.description}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += '<h3 style="margin-top: 20px;">✅ Misiones Completadas</h3>';
        
        if (completedQuests.length === 0) {
            html += '<p style="color: var(--td);">No hay misiones completadas</p>';
        } else {
            completedQuests.forEach(quest => {
                html += `
                    <div class="quest-card completed">
                        <div class="quest-icon">${quest.icon}</div>
                        <div class="quest-info">
                            <div class="quest-name">${quest.name}</div>
                            <div class="quest-desc">${quest.description}</div>
                        </div>
                    </div>
                `;
            });
        }

        content.innerHTML = html;
    },

    // ═══════════════════════════════════════════════════════
    // RENDERIZAR DIPLOMACIA
    // ═══════════════════════════════════════════════════════
    renderDiplomacy: function() {
        let panel = document.getElementById('diplomacyPanel');
        if (!panel) return;

        let content = panel.querySelector('.pc');
        if (!content) return;

        let html = '<h3>🤝 Diplomacia</h3>';

        WK.Diplomacy.tribes.forEach(tribe => {
            let relation = WK.Diplomacy.getRelation(tribe.id);
            let status = 'Neutral';
            let statusClass = 'neutral';

            if (relation.war) {
                status = 'En Guerra';
                statusClass = 'war';
            } else if (relation.alliance) {
                status = 'Aliado';
                statusClass = 'alliance';
            } else if (relation.reputation >= 70) {
                status = 'Amistoso';
                statusClass = 'friendly';
            } else if (relation.reputation < 30) {
                status = 'Hostil';
                statusClass = 'hostile';
            }

            html += `
                <div class="tribe-card">
                    <div class="tribe-header">
                        <div class="tribe-color" style="background-color: ${tribe.color}"></div>
                        <div class="tribe-name">${tribe.name}</div>
                        <div class="tribe-status ${statusClass}">${status}</div>
                    </div>
                    <div class="tribe-reputation">
                        <div class="reputation-bar">
                            <div class="reputation-fill" style="width: ${relation.reputation}%"></div>
                        </div>
                        <span>Reputación: ${Math.floor(relation.reputation)}</span>
                    </div>
                    <div class="tribe-actions">
                        <button class="btn-small" onclick="WK.UI.openTradeWindow('${tribe.id}')">Comerciar</button>
                        <button class="btn-small" onclick="WK.UI.openGiftWindow('${tribe.id}')">Regalo</button>
                        ${relation.war ? 
                            `<button class="btn-small" onclick="WK.Diplomacy.offerPeace('${tribe.id}')">Ofrecer Paz</button>` :
                            `<button class="btn-small" onclick="WK.Diplomacy.declareWar('${tribe.id}')">Declarar Guerra</button>`
                        }
                    </div>
                </div>
            `;
        });

        content.innerHTML = html;
    },

    // ═══════════════════════════════════════════════════════
    // ABRIR VENTANA DE COMERCIO
    // ═══════════════════════════════════════════════════════
    openTradeWindow: function(tribeId) {
        let tribeName = WK.Diplomacy.getTribeName(tribeId);
        
        let html = `
            <h3>🤝 Comerciar con ${tribeName}</h3>
            <div class="trade-options">
                <div class="trade-option">
                    <span>Dar 50 🪵 → Recibir 30 🍎</span>
                    <button onclick="WK.Diplomacy.trade('${tribeId}', 'wood', 50, 'food', 30)">Comerciar</button>
                </div>
                <div class="trade-option">
                    <span>Dar 30 🪨 → Recibir 20 🪵</span>
                    <button onclick="WK.Diplomacy.trade('${tribeId}', 'stone', 30, 'wood', 20)">Comerciar</button>
                </div>
                <div class="trade-option">
                    <span>Dar 40 🍎 → Recibir 25 🪵</span>
                    <button onclick="WK.Diplomacy.trade('${tribeId}', 'food', 40, 'wood', 25)">Comerciar</button>
                </div>
            </div>
        `;

        this.showModal(html);
    },

    // ═══════════════════════════════════════════════════════
    // ABRIR VENTANA DE REGALO
    // ═══════════════════════════════════════════════════════
    openGiftWindow: function(tribeId) {
        let tribeName = WK.Diplomacy.getTribeName(tribeId);
        
        let html = `
            <h3>🎁 Enviar Regalo a ${tribeName}</h3>
            <div class="gift-options">
                <div class="gift-option">
                    <span>Enviar 30 🍎</span>
                    <button onclick="WK.Diplomacy.sendGift('${tribeId}', 'food', 30)">Enviar</button>
                </div>
                <div class="gift-option">
                    <span>Enviar 20 🪵</span>
                    <button onclick="WK.Diplomacy.sendGift('${tribeId}', 'wood', 20)">Enviar</button>
                </div>
                <div class="gift-option">
                    <span>Enviar 15 🪨</span>
                    <button onclick="WK.Diplomacy.sendGift('${tribeId}', 'stone', 15)">Enviar</button>
                </div>
            </div>
        `;

        this.showModal(html);
    },

    // ═══════════════════════════════════════════════════════
    // MOSTRAR MODAL
    // ═══════════════════════════════════════════════════════
    showModal: function(content) {
        let modal = document.getElementById('modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close" onclick="WK.UI.closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    },

    // ═══════════════════════════════════════════════════════
    // CERRAR MODAL
    // ═══════════════════════════════════════════════════════
    closeModal: function() {
        let modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

console.log('[WK] UI System cargado');