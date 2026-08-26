// ═══════════════════════════════════════════════════════════
// 🌍 WORL KALM - QUESTS SYSTEM
// Sistema de misiones y logros
// ═══════════════════════════════════════════════════════════

WK.Quests = {
    activeQuests: [],
    completedQuests: [],
    availableQuests: [],

    // ═══════════════════════════════════════════════════════
    // DEFINICIÓN DE MISIONES
    // ═══════════════════════════════════════════════════════
    questDefinitions: [
        {
            id: 'first_house',
            name: 'Primer Hogar',
            description: 'Construye tu primera casa',
            icon: '🏠',
            reward: { wood: 50, stone: 30 },
            check: function() {
                return WK.Game.buildings.filter(b => b.type === 'hut' || b.type === 'house').length >= 1;
            }
        },
        {
            id: 'population_10',
            name: 'Aldea Creciente',
            description: 'Alcanza 10 aldeanos',
            icon: '👥',
            reward: { food: 100, knowledge: 20 },
            check: function() {
                return WK.Game.villagers.length >= 10;
            }
        },
        {
            id: 'population_25',
            name: 'Comunidad',
            description: 'Alcanza 25 aldeanos',
            icon: '👨‍👩‍👧‍👦',
            reward: { food: 200, knowledge: 50 },
            check: function() {
                return WK.Game.villagers.length >= 25;
            }
        },
        {
            id: 'population_50',
            name: 'Civilización',
            description: 'Alcanza 50 aldeanos',
            icon: '🏙️',
            reward: { food: 500, knowledge: 100 },
            check: function() {
                return WK.Game.villagers.length >= 50;
            }
        },
        {
            id: 'first_farm',
            name: 'Agricultor',
            description: 'Construye tu primera granja',
            icon: '🌾',
            reward: { wood: 30, stone: 20 },
            check: function() {
                return WK.Game.buildings.filter(b => b.type === 'farm').length >= 1;
            }
        },
        {
            id: 'first_temple',
            name: 'Fe',
            description: 'Construye tu primer templo',
            icon: '🏛️',
            reward: { faith: 50, knowledge: 30 },
            check: function() {
                return WK.Game.buildings.filter(b => b.type === 'temple').length >= 1;
            }
        },
        {
            id: 'first_library',
            name: 'Sabiduría',
            description: 'Construye tu primera biblioteca',
            icon: '📚',
            reward: { knowledge: 100 },
            check: function() {
                return WK.Game.buildings.filter(b => b.type === 'library').length >= 1;
            }
        },
        {
            id: 'first_hospital',
            name: 'Medicina',
            description: 'Construye tu primer hospital',
            icon: '🏥',
            reward: { knowledge: 50, faith: 30 },
            check: function() {
                return WK.Game.buildings.filter(b => b.type === 'hospital').length >= 1;
            }
        },
        {
            id: 'marriage_5',
            name: 'Amor en el Aire',
            description: '5 parejas se han formado',
            icon: '💍',
            reward: { food: 100, faith: 20 },
            check: function() {
                let marriages = WK.Game.villagers.filter(v => v.spouseId).length / 2;
                return marriages >= 5;
            }
        },
        {
            id: 'dogs_5',
            name: 'Manada',
            description: 'Ten 5 perros',
            icon: '🐕',
            reward: { food: 50 },
            check: function() {
                return WK.Game.dogs.length >= 5;
            }
        },
        {
            id: 'survive_30',
            name: 'Superviviente',
            description: 'Sobrevive 30 días',
            icon: '📅',
            reward: { food: 150, wood: 100, stone: 80 },
            check: function() {
                return WK.Game.day >= 30;
            }
        },
        {
            id: 'survive_100',
            name: 'Veterano',
            description: 'Sobrevive 100 días',
            icon: '🎖️',
            reward: { food: 500, wood: 300, stone: 200, knowledge: 100 },
            check: function() {
                return WK.Game.day >= 100;
            }
        },
        {
            id: 'knowledge_100',
            name: 'Erudito',
            description: 'Alcanza 100 de conocimiento',
            icon: '🧠',
            reward: { knowledge: 50 },
            check: function() {
                return WK.Game.stock.knowledge >= 100;
            }
        },
        {
            id: 'knowledge_500',
            name: 'Sabio',
            description: 'Alcanza 500 de conocimiento',
            icon: '🎓',
            reward: { knowledge: 100 },
            check: function() {
                return WK.Game.stock.knowledge >= 500;
            }
        },
        {
            id: 'faith_100',
            name: 'Devoto',
            description: 'Alcanza 100 de fe',
            icon: '🙏',
            reward: { faith: 50 },
            check: function() {
                return WK.Game.stock.faith >= 100;
            }
        },
        {
            id: 'faith_500',
            name: 'Santo',
            description: 'Alcanza 500 de fe',
            icon: '✨',
            reward: { faith: 100 },
            check: function() {
                return WK.Game.stock.faith >= 500;
            }
        },
        {
            id: 'buildings_10',
            name: 'Constructor',
            description: 'Construye 10 edificios',
            icon: '🏗️',
            reward: { wood: 100, stone: 80 },
            check: function() {
                return WK.Game.buildings.length >= 10;
            }
        },
        {
            id: 'buildings_25',
            name: 'Arquitecto',
            description: 'Construye 25 edificios',
            icon: '🏛️',
            reward: { wood: 200, stone: 150 },
            check: function() {
                return WK.Game.buildings.length >= 25;
            }
        },
        {
            id: 'defeat_10_animals',
            name: 'Cazador',
            description: 'Derrota 10 animales',
            icon: '🏹',
            reward: { food: 100 },
            check: function() {
                return (WK.Game.stats.animalsDefeated || 0) >= 10;
            }
        },
        {
            id: 'defeat_50_animals',
            name: 'Cazador Experto',
            description: 'Derrota 50 animales',
            icon: '🎯',
            reward: { food: 300 },
            check: function() {
                return (WK.Game.stats.animalsDefeated || 0) >= 50;
            }
        }
    ],

    // ═══════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════
    init: function() {
        // Cargar misiones disponibles
        this.availableQuests = this.questDefinitions.map(q => q.id);
        
        // Activar primeras misiones
        this.activateQuest('first_house');
        this.activateQuest('population_10');
    },

    // ═══════════════════════════════════════════════════════
    // ACTIVAR MISIÓN
    // ═══════════════════════════════════════════════════════
    activateQuest: function(questId) {
        if (!this.activeQuests.includes(questId) && !this.completedQuests.includes(questId)) {
            this.activeQuests.push(questId);
            let quest = this.questDefinitions.find(q => q.id === questId);
            if (quest) {
                WK.Game.log(`📜 Nueva misión: ${quest.name}`);
                WK.UI.showBanner(`📜 ${quest.name}`, 'info');
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // COMPLETAR MISIÓN
    // ═══════════════════════════════════════════════════════
    completeQuest: function(questId) {
        let index = this.activeQuests.indexOf(questId);
        if (index !== -1) {
            this.activeQuests.splice(index, 1);
            this.completedQuests.push(questId);
            
            let quest = this.questDefinitions.find(q => q.id === questId);
            if (quest) {
                // Dar recompensa
                if (quest.reward) {
                    for (let resource in quest.reward) {
                        WK.Game.stock[resource] = (WK.Game.stock[resource] || 0) + quest.reward[resource];
                    }
                }
                
                WK.Game.log(`✅ Misión completada: ${quest.name}`);
                WK.UI.showBanner(`✅ ¡${quest.name} completada!`, 'success');
                
                // Activar nuevas misiones
                this.checkNewQuests();
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // VERIFICAR NUEVAS MISIONES
    // ═══════════════════════════════════════════════════════
    checkNewQuests: function() {
        // Activar misiones basadas en progreso
        if (this.completedQuests.includes('first_house') && !this.activeQuests.includes('buildings_10')) {
            this.activateQuest('buildings_10');
        }
        
        if (this.completedQuests.includes('population_10') && !this.activeQuests.includes('population_25')) {
            this.activateQuest('population_25');
        }
        
        if (this.completedQuests.includes('population_25') && !this.activeQuests.includes('population_50')) {
            this.activateQuest('population_50');
        }
        
        if ((WK.Game.stats.animalsDefeated || 0) >= 10 && !this.activeQuests.includes('defeat_50_animals')) {
            this.activateQuest('defeat_50_animals');
        }
    },

    // ═══════════════════════════════════════════════════════
    // ACTUALIZACIÓN
    // ═══════════════════════════════════════════════════════
    update: function() {
        // Verificar misiones completadas
        for (let questId of this.activeQuests) {
            let quest = this.questDefinitions.find(q => q.id === questId);
            if (quest && quest.check()) {
                this.completeQuest(questId);
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER MISIONES ACTIVAS
    // ═══════════════════════════════════════════════════════
    getActiveQuests: function() {
        return this.activeQuests.map(id => {
            return this.questDefinitions.find(q => q.id === id);
        }).filter(q => q !== undefined);
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER MISIONES COMPLETADAS
    // ═══════════════════════════════════════════════════════
    getCompletedQuests: function() {
        return this.completedQuests.map(id => {
            return this.questDefinitions.find(q => q.id === id);
        }).filter(q => q !== undefined);
    }
};

console.log('[WK] Quests System cargado');