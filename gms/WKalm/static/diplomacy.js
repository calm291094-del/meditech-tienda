// ═══════════════════════════════════════════════════════════
// 🌍 WORL KALM - DIPLOMACY SYSTEM
// Sistema de diplomacia con tribus rivales
// ═══════════════════════════════════════════════════════════

WK.Diplomacy = {
    tribes: [],
    relations: {},

    // ═══════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════
    init: function() {
        // Crear tribus rivales
        this.tribes = [
            { id: 'tribe_1', name: 'Tribu del Lobo', color: '#8B4513', hostility: 0.3 },
            { id: 'tribe_2', name: 'Tribu del Águila', color: '#4682B4', hostility: 0.2 },
            { id: 'tribe_3', name: 'Tribu del Oso', color: '#654321', hostility: 0.4 }
        ];

        // Inicializar relaciones
        this.tribes.forEach(tribe => {
            this.relations[tribe.id] = {
                reputation: 50,
                trade: false,
                alliance: false,
                war: false
            };
        });
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER RELACIÓN
    // ═══════════════════════════════════════════════════════
    getRelation: function(tribeId) {
        return this.relations[tribeId] || { reputation: 50, trade: false, alliance: false, war: false };
    },

    // ═══════════════════════════════════════════════════════
    // MODIFICAR REPUTACIÓN
    // ═══════════════════════════════════════════════════════
    changeReputation: function(tribeId, amount) {
        let relation = this.getRelation(tribeId);
        relation.reputation = Math.max(0, Math.min(100, relation.reputation + amount));
        
        // Actualizar estado de relación
        if (relation.reputation >= 80 && !relation.alliance) {
            relation.alliance = true;
            WK.Game.log(`🤝 Alianza formada con ${this.getTribeName(tribeId)}`);
            WK.UI.showBanner(`🤝 ¡Alianza con ${this.getTribeName(tribeId)}!`, 'success');
        } else if (relation.reputation < 30 && relation.alliance) {
            relation.alliance = false;
            WK.Game.log(`💔 Alianza rota con ${this.getTribeName(tribeId)}`);
        }
        
        if (relation.reputation < 20 && !relation.war) {
            relation.war = true;
            WK.Game.log(`⚔️ Guerra declarada con ${this.getTribeName(tribeId)}`);
            WK.UI.showBanner(`⚔️ ¡Guerra con ${this.getTribeName(tribeId)}!`, 'danger');
        } else if (relation.reputation >= 40 && relation.war) {
            relation.war = false;
            WK.Game.log(`🕊️ Paz con ${this.getTribeName(tribeId)}`);
        }
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER NOMBRE DE TRIBU
    // ═══════════════════════════════════════════════════════
    getTribeName: function(tribeId) {
        let tribe = this.tribes.find(t => t.id === tribeId);
        return tribe ? tribe.name : 'Tribu Desconocida';
    },

    // ═══════════════════════════════════════════════════════
    // COMERCIAR
    // ═══════════════════════════════════════════════════════
    trade: function(tribeId, giveResource, giveAmount, receiveResource, receiveAmount) {
        let relation = this.getRelation(tribeId);
        
        if (relation.war) {
            WK.UI.showBanner('❌ No puedes comerciar en guerra', 'danger');
            return false;
        }
        
        if (WK.Game.stock[giveResource] < giveAmount) {
            WK.UI.showBanner('❌ Recursos insuficientes', 'danger');
            return false;
        }
        
        // Realizar intercambio
        WK.Game.stock[giveResource] -= giveAmount;
        WK.Game.stock[receiveResource] = (WK.Game.stock[receiveResource] || 0) + receiveAmount;
        
        // Mejorar reputación
        this.changeReputation(tribeId, 5);
        
        WK.Game.log(`🤝 Comercio con ${this.getTribeName(tribeId)}`);
        return true;
    },

    // ═══════════════════════════════════════════════════════
    // ENVIAR REGALO
    // ═══════════════════════════════════════════════════════
    sendGift: function(tribeId, resource, amount) {
        let relation = this.getRelation(tribeId);
        
        if (WK.Game.stock[resource] < amount) {
            WK.UI.showBanner('❌ Recursos insuficientes', 'danger');
            return false;
        }
        
        WK.Game.stock[resource] -= amount;
        this.changeReputation(tribeId, 10);
        
        WK.Game.log(`🎁 Regalo enviado a ${this.getTribeName(tribeId)}`);
        return true;
    },

    // ═══════════════════════════════════════════════════════
    // DECLARAR GUERRA
    // ═══════════════════════════════════════════════════════
    declareWar: function(tribeId) {
        let relation = this.getRelation(tribeId);
        relation.war = true;
        relation.alliance = false;
        relation.reputation = 0;
        
        WK.Game.log(`⚔️ Guerra declarada con ${this.getTribeName(tribeId)}`);
        WK.UI.showBanner(`⚔️ ¡Guerra con ${this.getTribeName(tribeId)}!`, 'danger');
    },

    // ═══════════════════════════════════════════════════════
    // OFRECER PAZ
    // ═══════════════════════════════════════════════════════
    offerPeace: function(tribeId) {
        let relation = this.getRelation(tribeId);
        
        if (!relation.war) {
            WK.UI.showBanner('❌ No estás en guerra', 'warning');
            return false;
        }
        
        // Requerir recursos para paz
        if (WK.Game.stock.gold < 100) {
            WK.UI.showBanner('❌ Necesitas 100 de oro para ofrecer paz', 'danger');
            return false;
        }
        
        WK.Game.stock.gold -= 100;
        relation.war = false;
        relation.reputation = 40;
        
        WK.Game.log(`🕊️ Paz ofrecida a ${this.getTribeName(tribeId)}`);
        WK.UI.showBanner(`🕊️ Paz con ${this.getTribeName(tribeId)}`, 'success');
        return true;
    },

    // ═══════════════════════════════════════════════════════
    // ACTUALIZACIÓN
    // ═══════════════════════════════════════════════════════
    update: function() {
        // Decaimiento natural de reputación
        for (let tribeId in this.relations) {
            let relation = this.relations[tribeId];
            
            // Si hay guerra, la reputación no decae
            if (!relation.war) {
                relation.reputation = Math.max(0, relation.reputation - 0.01);
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER TRIBUS EN GUERRA
    // ═══════════════════════════════════════════════════════
    getWarringTribes: function() {
        return this.tribes.filter(tribe => {
            let relation = this.getRelation(tribe.id);
            return relation.war;
        });
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER TRIBUS ALIADAS
    // ═══════════════════════════════════════════════════════
    getAlliedTribes: function() {
        return this.tribes.filter(tribe => {
            let relation = this.getRelation(tribe.id);
            return relation.alliance;
        });
    }
};

console.log('[WK] Diplomacy System cargado');