// ═══════════════════════════════════════════════════════════
// 🌍 WORL KALM - EVENTS SYSTEM
// Sistema de eventos aleatorios y programados
// ═══════════════════════════════════════════════════════════

WK.Events = {
    events: [],
    lastEventTime: 0,
    eventInterval: 60000, // 1 minuto entre eventos

    // ═══════════════════════════════════════════════════════
    // DEFINICIÓN DE EVENTOS
    // ═══════════════════════════════════════════════════════
    eventDefinitions: [
        {
            id: 'plague',
            name: 'Plaga',
            icon: '☠️',
            weight: 10,
            minDay: 10,
            execute: function() {
                let affected = Math.floor(G.villagers.length * 0.3);
                for (let i = 0; i < affected && i < G.villagers.length; i++) {
                    let villager = G.villagers[Math.floor(Math.random() * G.villagers.length)];
                    if (!villager.sick) {
                        villager.sick = true;
                        villager.sicknessTimer = 5000;
                    }
                }
                G.log('☠️ Una plaga ha afectado a la aldea');
                WK.UI.showBanner('☠️ ¡Plaga!', 'danger');
            }
        },
        {
            id: 'good_harvest',
            name: 'Buena Cosecha',
            icon: '🌾',
            weight: 20,
            minDay: 5,
            execute: function() {
                G.stock.food += 50;
                G.log('🌾 La cosecha fue abundante (+50 comida)');
                WK.UI.showBanner('🌾 ¡Buena cosecha!', 'success');
            }
        },
        {
            id: 'drought',
            name: 'Sequía',
            icon: '☀️',
            weight: 15,
            minDay: 8,
            execute: function() {
                G.stock.food = Math.max(0, G.stock.food - 30);
                G.log('☀️ La sequía ha arruinado las cosechas (-30 comida)');
                WK.UI.showBanner('☀️ ¡Sequía!', 'warning');
            }
        },
        {
            id: 'discovery',
            name: 'Descubrimiento',
            icon: '💡',
            weight: 25,
            minDay: 3,
            execute: function() {
                G.stock.knowledge += 30;
                G.log('💡 Un descubrimiento ha aumentado el conocimiento (+30)');
                WK.UI.showBanner('💡 ¡Descubrimiento!', 'success');
            }
        },
        {
            id: 'raid',
            name: 'Incursión',
            icon: '⚔️',
            weight: 12,
            minDay: 15,
            execute: function() {
                let damage = Math.floor(Math.random() * 20) + 10;
                G.stock.food = Math.max(0, G.stock.food - damage);
                G.stock.wood = Math.max(0, G.stock.wood - Math.floor(damage / 2));
                G.log(`⚔️ Una incursión enemiga ha robado recursos (-${damage} comida, -${Math.floor(damage/2)} madera)`);
                WK.UI.showBanner('⚔️ ¡Incursión enemiga!', 'danger');
            }
        },
        {
            id: 'festival',
            name: 'Festival',
            icon: '🎉',
            weight: 18,
            minDay: 7,
            execute: function() {
                G.villagers.forEach(v => {
                    v.social = Math.min(100, v.social + 20);
                    v.mood = Math.min(100, v.mood + 20);
                });
                G.log('🎉 Un festival ha alegrado a la aldea');
                WK.UI.showBanner('🎉 ¡Festival!', 'success');
            }
        },
        {
            id: 'earthquake',
            name: 'Terremoto',
            icon: '🌋',
            weight: 8,
            minDay: 20,
            execute: function() {
                // Dañar edificios aleatorios
                let damaged = Math.floor(G.buildings.length * 0.2);
                for (let i = 0; i < damaged && i < G.buildings.length; i++) {
                    let building = G.buildings[Math.floor(Math.random() * G.buildings.length)];
                    if (building.hp) {
                        building.hp = Math.max(0, building.hp - 30);
                        if (building.hp <= 0) {
                            G.buildings = G.buildings.filter(b => b.id !== building.id);
                        }
                    }
                }
                G.log('🌋 Un terremoto ha dañado la aldea');
                WK.UI.showBanner('🌋 ¡Terremoto!', 'danger');
            }
        },
        {
            id: 'migration',
            name: 'Migración',
            icon: '🚶',
            weight: 22,
            minDay: 10,
            execute: function() {
                let newcomers = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < newcomers; i++) {
                    let villager = WK.Game.createVillager(
                        WK.Game.villageCenter.x + (Math.random() - 0.5) * 200,
                        WK.Game.villageCenter.y + (Math.random() - 0.5) * 200
                    );
                    G.villagers.push(villager);
                }
                G.log(`🚶 ${newcomers} nuevos aldeanos han llegado`);
                WK.UI.showBanner(`🚶 ¡${newcomers} nuevos aldeanos!`, 'success');
            }
        },
        {
            id: 'miracle',
            name: 'Milagro',
            icon: '✨',
            weight: 5,
            minDay: 15,
            execute: function() {
                G.villagers.forEach(v => {
                    v.hp = Math.min(100, v.hp + 30);
                    v.energy = Math.min(100, v.energy + 30);
                    v.hunger = Math.min(100, v.hunger + 30);
                });
                G.stock.food += 30;
                G.log('✨ Un milagro ha bendecido a la aldea');
                WK.UI.showBanner('✨ ¡Milagro!', 'success');
            }
        },
        {
            id: 'animal_attack',
            name: 'Ataque de Animales',
            icon: '🐺',
            weight: 15,
            minDay: 5,
            execute: function() {
                // Spawnear animales hostiles
                let hostileAnimals = ['wolf', 'bear', 'boar'];
                let count = Math.floor(Math.random() * 3) + 2;
                
                for (let i = 0; i < count; i++) {
                    let type = hostileAnimals[Math.floor(Math.random() * hostileAnimals.length)];
                    let animal = WK.Game.createAnimal(
                        WK.Game.villageCenter.x + (Math.random() - 0.5) * 300,
                        WK.Game.villageCenter.y + (Math.random() - 0.5) * 300,
                        type
                    );
                    G.animals.push(animal);
                }
                G.log(`🐺 Animales hostiles atacan la aldea`);
                WK.UI.showBanner('🐺 ¡Ataque de animales!', 'danger');
            }
        },
        {
            id: 'trade_caravan',
            name: 'Caravana Comercial',
            icon: '🐪',
            weight: 20,
            minDay: 10,
            execute: function() {
                // Intercambio de recursos
                if (G.stock.wood > 30) {
                    G.stock.wood -= 30;
                    G.stock.food += 40;
                    G.log('🐪 Una caravana comercial intercambió madera por comida');
                    WK.UI.showBanner('🐪 ¡Caravana comercial!', 'success');
                }
            }
        },
        {
            id: 'inspiration',
            name: 'Inspiración',
            icon: '🎨',
            weight: 15,
            minDay: 12,
            execute: function() {
                G.stock.knowledge += 40;
                G.villagers.forEach(v => {
                    v.mood = Math.min(100, v.mood + 15);
                });
                G.log('🎨 La aldea ha sido inspirada (+40 conocimiento)');
                WK.UI.showBanner('🎨 ¡Inspiración!', 'success');
            }
        },
        {
            id: 'storm',
            name: 'Tormenta',
            icon: '⛈️',
            weight: 12,
            minDay: 8,
            execute: function() {
                G.stock.wood = Math.max(0, G.stock.wood - 20);
                G.villagers.forEach(v => {
                    v.energy = Math.max(0, v.energy - 10);
                });
                G.log('⛈️ Una tormenta ha azotado la aldea');
                WK.UI.showBanner('⛈️ ¡Tormenta!', 'warning');
            }
        },
        {
            id: 'blessing',
            name: 'Bendición',
            icon: '🙏',
            weight: 18,
            minDay: 5,
            execute: function() {
                G.stock.faith += 25;
                G.villagers.forEach(v => {
                    v.social = Math.min(100, v.social + 10);
                });
                G.log('🙏 Una bendición ha aumentado la fe (+25)');
                WK.UI.showBanner('🙏 ¡Bendición!', 'success');
            }
        },
        {
            id: 'famine',
            name: 'Hambruna',
            icon: '🥀',
            weight: 10,
            minDay: 15,
            execute: function() {
                G.stock.food = Math.max(0, G.stock.food - 50);
                G.villagers.forEach(v => {
                    v.hunger = Math.max(0, v.hunger - 30);
                });
                G.log('🥀 La hambruna ha llegado a la aldea');
                WK.UI.showBanner('🥀 ¡Hambruna!', 'danger');
            }
        }
    ],

    // ═══════════════════════════════════════════════════════
    // ACTUALIZACIÓN
    // ═══════════════════════════════════════════════════════
    update: function() {
        let currentTime = Date.now();
        
        // Verificar si es tiempo de un nuevo evento
        if (currentTime - this.lastEventTime >= this.eventInterval) {
            this.triggerRandomEvent();
            this.lastEventTime = currentTime;
        }
    },

    // ═══════════════════════════════════════════════════════
    // DISPARAR EVENTO ALEATORIO
    // ═══════════════════════════════════════════════════════
    triggerRandomEvent: function() {
        let G = WK.Game;
        
        // Filtrar eventos disponibles según el día actual
        let availableEvents = this.eventDefinitions.filter(event => {
            return G.day >= event.minDay;
        });

        if (availableEvents.length === 0) return;

        // Calcular peso total
        let totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
        
        // Seleccionar evento aleatorio basado en peso
        let random = Math.random() * totalWeight;
        let cumulative = 0;
        
        for (let event of availableEvents) {
            cumulative += event.weight;
            if (random <= cumulative) {
                event.execute();
                break;
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // DISPARAR EVENTO ESPECÍFICO
    // ═══════════════════════════════════════════════════════
    triggerEvent: function(eventId) {
        let event = this.eventDefinitions.find(e => e.id === eventId);
        if (event) {
            event.execute();
        }
    },

    // ═══════════════════════════════════════════════════════
    // OBTENER EVENTOS DISPONIBLES
    // ═══════════════════════════════════════════════════════
    getAvailableEvents: function() {
        let G = WK.Game;
        return this.eventDefinitions.filter(event => {
            return G.day >= event.minDay;
        });
    }
};

console.log('[WK] Events System cargado');