// ═══════════════════════════════════════════════════════════
// 🌍 WORL KALM - AI ENGINE
// Motor de IA por Utilidad para NPCs
// ═══════════════════════════════════════════════════════════

WK.AI = {
    // ═══════════════════════════════════════════════════════
    // EVALUACIÓN DE NECESIDADES
    // ═══════════════════════════════════════════════════════
    evaluateNeeds: function(villager) {
        let needs = {
            survival: 0,
            hunger: 0,
            thirst: 0,
            energy: 0,
            social: 0,
            safety: 0,
            curiosity: 0,
            reproduction: 0
        };

        // Supervivencia (HP bajo)
        if (villager.hp < 50) {
            needs.survival = (50 - villager.hp) / 50 * 100;
        }

        // Hambre
        if (villager.hunger < 70) {
            needs.hunger = (70 - villager.hunger) / 70 * 100;
        }

        // Energía
        if (villager.energy < 60) {
            needs.energy = (60 - villager.energy) / 60 * 100;
        }

        // Social
        if (villager.social < 50) {
            needs.social = (50 - villager.social) / 50 * 100;
        }

        // Seguridad (amenazas cercanas)
        let threats = WK.Game.getThreatsNear(villager.x, villager.y, 200);
        if (threats.length > 0) {
            needs.safety = Math.min(100, threats.length * 30);
        }

        // Curiosidad (edad joven)
        if (villager.age < 30) {
            needs.curiosity = (30 - v.age) / 30 * 50;
        }

        // Reproducción (edad adulta, sin pareja)
        if (villager.age >= 18 && villager.age < 50 && !villager.spouseId) {
            needs.reproduction = 40;
        }

        return needs;
    },

    // ═══════════════════════════════════════════════════════
    // EVALUACIÓN DE ACCIONES
    // ═══════════════════════════════════════════════════════
    evaluateActions: function(villager, needs) {
        let actions = [];

        // Acción: Comer
        if (needs.hunger > 30) {
            let foodSource = this.findFood(villager);
            if (foodSource) {
                let score = needs.hunger * 0.8;
                // Bonus si es glotón
                if (villager.traits.includes('glutton')) score *= 1.3;
                // Penalización si es enfermo
                if (villager.traits.includes('sickly')) score *= 0.7;
                
                actions.push({
                    type: 'eat',
                    target: foodSource,
                    score: score,
                    reason: 'Hambre'
                });
            }
        }

        // Acción: Dormir
        if (needs.energy > 40) {
            let bed = this.findBed(villager);
            if (bed) {
                let score = needs.energy * 0.7;
                actions.push({
                    type: 'sleep',
                    target: bed,
                    score: score,
                    reason: 'Cansancio'
                });
            }
        }

        // Acción: Socializar
        if (needs.social > 30) {
            let friend = this.findFriend(villager);
            if (friend) {
                let score = needs.social * 0.6;
                // Bonus si es sociable
                if (villager.traits.includes('social')) score *= 1.4;
                
                actions.push({
                    type: 'socialize',
                    target: friend,
                    score: score,
                    reason: 'Soledad'
                });
            }
        }

        // Acción: Buscar pareja
        if (needs.reproduction > 30) {
            let partner = this.findPartner(villager);
            if (partner) {
                let score = needs.reproduction * 0.9;
                // Bonus si es fértil
                if (villager.traits.includes('fertile')) score *= 1.5;
                // Bonus si es carismático
                if (villager.traits.includes('charismatic')) score *= 1.3;
                
                actions.push({
                    type: 'court',
                    target: partner,
                    score: score,
                    reason: 'Reproducción'
                });
            }
        }

        // Acción: Trabajar (recolectar recursos)
        if (needs.hunger < 30 && needs.energy < 40) {
            let resource = this.findResourceToGather(villager);
            if (resource) {
                let score = 50;
                // Bonus según personalidad
                if (villager.personality === 'worker') score *= 1.5;
                if (villager.personality === 'lazy') score *= 0.5;
                
                actions.push({
                    type: 'gather',
                    target: resource,
                    score: score,
                    reason: 'Trabajo'
                });
            }
        }

        // Acción: Explorar
        if (needs.curiosity > 30) {
            let explorePoint = this.findExplorePoint(villager);
            if (exploredPoint) {
                let score = needs.curiosity * 0.5;
                // Bonus si es explorador
                if (villager.personality === 'explorer') score *= 1.6;
                
                actions.push({
                    type: 'explore',
                    target: explorePoint,
                    score: score,
                    reason: 'Curiosidad'
                });
            }
        }

        // Acción: Huir de peligro
        if (needs.safety > 50) {
            let safePoint = this.findSafePoint(villager);
            if (safePoint) {
                let score = needs.safety * 1.0;
                // Bonus si es valiente (menos miedo)
                if (villager.traits.includes('brave')) score *= 0.6;
                
                actions.push({
                    type: 'flee',
                    target: safePoint,
                    score: score,
                    reason: 'Peligro'
                });
            }
        }

        // Acción: Defenderse
        if (needs.safety > 60 && villager.weapon) {
            let threat = WK.Game.getThreatsNear(villager.x, villager.y, 100)[0];
            if (threat) {
                let score = needs.safety * 0.9;
                // Bonus si es guerrero
                if (villager.personality === 'warrior') score *= 1.5;
                // Bonus si es valiente
                if (villager.traits.includes('brave')) score *= 1.3;
                
                actions.push({
                    type: 'defend',
                    target: threat,
                    score: score,
                    reason: 'Defensa'
                });
            }
        }

        // Acción: Curarse (si está enfermo)
        if (villager.sick && needs.survival > 40) {
            let hospital = this.findBuilding('hospital');
            if (hospital) {
                let score = needs.survival * 0.95;
                actions.push({
                    type: 'heal',
                    target: hospital,
                    score: score,
                    reason: 'Enfermedad'
                });
            }
        }

        // Acción: Rezar (si es piadoso)
        if (villager.personality === 'pious' && Math.random() < 0.3) {
            let temple = this.findBuilding('temple');
            if (temple) {
                let score = 40;
                actions.push({
                    type: 'pray',
                    target: temple,
                    score: score,
                    reason: 'Fe'
                });
            }
        }

        // Acción: Construir (si hay proyecto pendiente)
        if (WK.Game.buildingProject && needs.energy < 50) {
            let score = 45;
            // Bonus si es trabajador
            if (villager.personality === 'worker') score *= 1.4;
            
            actions.push({
                type: 'build',
                target: { x: WK.Game.buildingProject.x, y: WK.Game.buildingProject.y },
                score: score,
                reason: 'Construcción'
            });
        }

        // Acción: Investigar (si es sabio)
        if (villager.personality === 'wise' && needs.energy < 50) {
            let library = this.findBuilding('library');
            if (library) {
                let score = 40;
                actions.push({
                    type: 'research',
                    target: library,
                    score: score,
                    reason: 'Sabiduría'
                });
            }
        }

        // Ordenar por score (mayor primero)
        actions.sort((a, b) => b.score - a.score);

        return actions;
    },

    // ═══════════════════════════════════════════════════════
    // BÚSQUEDA DE OBJETIVOS
    // ═══════════════════════════════════════════════════════
    findFood: function(villager) {
        // Buscar comida en el inventario primero
        if (WK.Game.stock.food > 0) {
            return { type: 'stock', x: villager.x, y: villager.y };
        }

        // Buscar bayas cercanas
        let berries = WK.Game.resources.filter(r => r.type === 'berry' && r.amount > 0);
        if (berries.length > 0) {
            let closest = berries.reduce((prev, curr) => {
                let prevDist = WK.U.dist(villager, prev);
                let currDist = WK.U.dist(villager, curr);
                return currDist < prevDist ? curr : prev;
            });
            return closest;
        }

        return null;
    },

    findBed: function(villager) {
        // Buscar cama en casa
        if (villager.homeId) {
            let home = WK.Game.buildings.find(b => b.id === v.homeId);
            if (home) return home;
        }

        // Buscar cualquier casa con espacio
        let houses = WK.Game.buildings.filter(b => 
            (b.type === 'hut' || b.type === 'house') && 
            b.occupants.length < b.capacity
        );
        
        if (houses.length > 0) {
            let closest = houses.reduce((prev, curr) => {
                let prevDist = WK.U.dist(villager, prev);
                let currDist = WK.U.dist(villager, curr);
                return currDist < prevDist ? curr : prev;
            });
            return closest;
        }

        return null;
    },

    findFriend: function(villager) {
        // Buscar amigos cercanos
        let villagers = WK.Game.villagers.filter(v => 
            v.id !== villager.id && 
            v.alive && 
            !v.sick
        );

        if (villagers.length > 0) {
            // Preferir amigos existentes
            let friends = villagers.filter(v => villager.friends.includes(v.id));
            if (friends.length > 0) {
                return friends[Math.floor(Math.random() * friends.length)];
            }
            // Si no tiene amigos, elegir cualquiera
            return villagers[Math.floor(Math.random() * villagers.length)];
        }

        return null;
    },

    findPartner: function(villager) {
        // Buscar pareja potencial
        let candidates = WK.Game.villagers.filter(v => 
            v.id !== villager.id &&
            v.alive &&
            !v.sick &&
            !v.spouseId &&
            v.gender !== villager.gender &&
            v.age >= 18 &&
            v.age < 50
        );

        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        return null;
    },

    findResourceToGather: function(villager) {
        // Determinar qué recurso falta más
        let needs = {
            wood: WK.Game.stock.wood < 50 ? 50 - WK.Game.stock.wood : 0,
            stone: WK.Game.stock.stone < 30 ? 30 - WK.Game.stock.stone : 0,
            food: WK.Game.stock.food < 100 ? 100 - WK.Game.stock.food : 0
        };

        let maxNeed = Math.max(needs.wood, needs.stone, needs.food);
        let resourceType = null;

        if (maxNeed === needs.wood) resourceType = 'tree';
        else if (maxNeed === needs.stone) resourceType = 'stone';
        else if (maxNeed === needs.food) resourceType = 'berry';

        if (!resourceType) return null;

        // Buscar recurso de ese tipo
        let resources = WK.Game.resources.filter(r => 
            r.type === resourceType && 
            r.amount > 0
        );

        if (resources.length > 0) {
            let closest = resources.reduce((prev, curr) => {
                let prevDist = WK.U.dist(villager, prev);
                let currDist = WK.U.dist(villager, curr);
                return currDist < prevDist ? curr : prev;
            });
            return closest;
        }

        return null;
    },

    findExplorePoint: function(villager) {
        // Buscar un punto no explorado
        let mapSize = WK.CFG.MAP_SIZE;
        let tileSize = WK.CFG.TILE_SIZE;

        for (let attempt = 0; attempt < 10; attempt++) {
            let x = Math.floor(Math.random() * mapSize);
            let y = Math.floor(Math.random() * mapSize);

            if (!WK.Game.explored[y][x]) {
                return { x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2 };
            }
        }

        return null;
    },

    findSafePoint: function(villager) {
        // Buscar un punto alejado de amenazas
        let threats = WK.Game.getThreatsNear(villager.x, villager.y, 300);
        
        if (threats.length === 0) return null;

        // Calcular dirección opuesta a las amenazas
        let avgThreatX = threats.reduce((sum, t) => sum + t.x, 0) / threats.length;
        let avgThreatY = threats.reduce((sum, t) => sum + t.y, 0) / threats.length;

        let dx = villager.x - avgThreatX;
        let dy = villager.y - avgThreatY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return { x: villager.x + 100, y: villager.y };

        // Normalizar y multiplicar por distancia de escape
        let escapeDistance = 200;
        let safeX = villager.x + (dx / dist) * escapeDistance;
        let safeY = villager.y + (dy / dist) * escapeDistance;

        // Asegurar que esté dentro del mapa
        let mapSize = WK.CFG.MAP_SIZE;
        let tileSize = WK.CFG.TILE_SIZE;
        safeX = Math.max(0, Math.min(mapSize * tileSize, safeX));
        safeY = Math.max(0, Math.min(mapSize * tileSize, safeY));

        return { x: safeX, y: safeY };
    },

    findBuilding: function(type) {
        let buildings = WK.Game.buildings.filter(b => b.type === type);
        if (buildings.length > 0) {
            return buildings[0];
        }
        return null;
    },

    // ═══════════════════════════════════════════════════════
    // EJECUCIÓN DE ACCIONES
    // ═══════════════════════════════════════════════════════
    executeAction: function(villager, action) {
        villager.currentAction = action.type;
        villager.target = action.target;
        villager.actionReason = action.reason;

        switch (action.type) {
            case 'eat':
                this.executeEat(villager, action.target);
                break;
            case 'sleep':
                this.executeSleep(villager, action.target);
                break;
            case 'socialize':
                this.executeSocialize(villager, action.target);
                break;
            case 'court':
                this.executeCourt(villager, action.target);
                break;
            case 'gather':
                this.executeGather(villager, action.target);
                break;
            case 'explore':
                this.executeExplore(villager, action.target);
                break;
            case 'flee':
                this.executeFlee(villager, action.target);
                break;
            case 'defend':
                this.executeDefend(villager, action.target);
                break;
            case 'heal':
                this.executeHeal(villager, action.target);
                break;
            case 'pray':
                this.executePray(villager, action.target);
                break;
            case 'build':
                this.executeBuild(villager, action.target);
                break;
            case 'research':
                this.executeResearch(villager, action.target);
                break;
        }
    },

    executeEat: function(villager, target) {
        if (WK.U.dist(villager, target) < 20) {
            if (target.type === 'stock') {
                // Comer del stock
                if (WK.Game.stock.food > 0) {
                    WK.Game.stock.food -= 10;
                    villager.hunger = Math.min(100, villager.hunger + 30);
                    villager.energy = Math.min(100, villager.energy + 10);
                    villager.currentAction = null;
                }
            } else if (target.type === 'berry') {
                // Comer bayas
                if (target.amount > 0) {
                    target.amount -= 5;
                    villager.hunger = Math.min(100, villager.hunger + 15);
                    villager.currentAction = null;
                }
            }
        } else {
            // Mover hacia la comida
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeSleep: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Dormir
            villager.energy = Math.min(100, villager.energy + 0.5);
            if (villager.energy >= 100) {
                villager.currentAction = null;
            }
        } else {
            // Mover hacia la cama
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeSocialize: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Socializar
            villager.social = Math.min(100, v.social + 0.3);
            target.social = Math.min(100, target.social + 0.3);
            
            // Posibilidad de hacerse amigos
            if (Math.random() < 0.1 && !villager.friends.includes(target.id)) {
                villager.friends.push(target.id);
                target.friends.push(villager.id);
            }
            
            if (villager.social >= 100) {
                villager.currentAction = null;
            }
        } else {
            // Mover hacia el amigo
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeCourt: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Cortejar
            villager.social = Math.min(100, villager.social + 0.5);
            target.social = Math.min(100, target.social + 0.5);
            
            // Posibilidad de matrimonio
            let marriageChance = 0.05;
            if (villager.traits.includes('charismatic')) marriageChance *= 1.5;
            if (villager.traits.includes('fertile')) marriageChance *= 1.3;
            
            if (Math.random() < marriageChance) {
                villager.spouseId = target.id;
                target.spouseId = villager.id;
                G.log(`💍 ${villager.name} y ${target.name} se casaron`);
                villager.currentAction = null;
            }
        } else {
            // Mover hacia la pareja
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeGather: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Recolectar
            if (target.amount > 0) {
                let amount = Math.min(10, target.amount);
                target.amount -= amount;
                
                if (target.type === 'tree') {
                    WK.Game.stock.wood += amount;
                } else if (target.type === 'stone') {
                    WK.Game.stock.stone += amount;
                } else if (target.type === 'berry') {
                    WK.Game.stock.food += amount;
                }
                
                villager.currentAction = null;
            }
        } else {
            // Mover hacia el recurso
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeExplore: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Explorar
            let mapSize = WK.CFG.MAP_SIZE;
            let tileSize = WK.CFG.TILE_SIZE;
            let tileX = Math.floor(target.x / tileSize);
            let tileY = Math.floor(target.y / tileSize);
            
            // Marcar como explorado
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    let nx = tileX + dx;
                    let ny = tileY + dy;
                    if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
                        WK.Game.explored[ny][nx] = true;
                    }
                }
            }
            
            villager.currentAction = null;
        } else {
            // Mover hacia el punto
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeFlee: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Llegó a un lugar seguro
            villager.currentAction = null;
        } else {
            // Correr hacia el lugar seguro
            WK.AI.moveToTarget(villager, target, 2.0); // Velocidad aumentada
        }
    },

    executeDefend: function(villager, target) {
        if (!target.alive) {
            villager.currentAction = null;
            return;
        }

        if (WK.U.dist(villager, target) < 30) {
            // Atacar
            let damage = 10;
            if (villager.weapon) {
                let weapon = WK.D.WEAPONS.find(w => w.id === villager.weapon);
                if (weapon) damage += weapon.damage;
            }
            
            target.hp -= damage;
            
            if (target.hp <= 0) {
                target.alive = false;
                G.log(`⚔️ ${villager.name} derrotó a ${target.name || 'una amenaza'}`);
                villager.currentAction = null;
            }
        } else {
            // Mover hacia la amenaza
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeHeal: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Curarse
            villager.hp = Math.min(100, villager.hp + 1);
            if (villager.hp >= 100) {
                villager.sick = false;
                villager.currentAction = null;
            }
        } else {
            // Mover hacia el hospital
            WK.AI.moveToTarget(villager, target);
        }
    },

    executePray: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Rezar
            WK.Game.stock.faith += 0.1;
            villager.social = Math.min(100, villager.social + 0.2);
            
            if (Math.random() < 0.1) {
                villager.currentAction = null;
            }
        } else {
            // Mover hacia el templo
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeBuild: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Construir
            if (WK.Game.buildingProject) {
                WK.Game.buildingProject.progress += 1;
                
                if (WK.Game.buildingProject.progress >= WK.Game.buildingProject.maxProgress) {
                    // Construcción completada
                    let building = {
                        id: WK.U.uid(),
                        type: WK.Game.buildingProject.type,
                        x: WK.Game.buildingProject.x,
                        y: WK.Game.buildingProject.y,
                        occupants: [],
                        capacity: WK.Game.buildingProject.capacity
                    };
                    WK.Game.buildings.push(building);
                    G.log(`🏗️ ${villager.name} completó la construcción de ${WK.Game.buildingProject.type}`);
                    WK.Game.buildingProject = null;
                    villager.currentAction = null;
                }
            }
        } else {
            // Mover hacia el sitio de construcción
            WK.AI.moveToTarget(villager, target);
        }
    },

    executeResearch: function(villager, target) {
        if (WK.U.dist(villager, target) < 30) {
            // Investigar
            WK.Game.stock.knowledge += 0.2;
            
            if (Math.random() < 0.05) {
                villager.currentAction = null;
            }
        } else {
            // Mover hacia la biblioteca
            WK.AI.moveToTarget(villager, target);
        }
    },

    // ═══════════════════════════════════════════════════════
    // MOVIMIENTO
    // ═══════════════════════════════════════════════════════
    moveToTarget: function(villager, target, speedMultiplier = 1.0) {
        let dx = target.x - villager.x;
        let dy = target.y - villager.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            let speed = 1.0 * speedMultiplier;
            
            // Bonus de velocidad según rasgos
            if (villager.traits.includes('swift')) speed *= 1.3;
            
            // Penalización por enfermedad
            if (villager.sick) speed *= 0.5;
            
            // Penalización por edad
            if (villager.age > 60) speed *= 0.7;

            villager.vx = (dx / dist) * speed;
            villager.vy = (dy / dist) * speed;
        }
    },

    // ═══════════════════════════════════════════════════════
    // ACTUALIZACIÓN PRINCIPAL
    // ═══════════════════════════════════════════════════════
    update: function(villager) {
        if (!villager.alive) return;

        // Si no tiene acción actual o terminó la anterior
        if (!villager.currentAction) {
            // Evaluar necesidades
            let needs = this.evaluateNeeds(villager);
            
            // Evaluar acciones posibles
            let actions = this.evaluateActions(villager, needs);
            
            // Elegir la mejor acción
            if (actions.length > 0) {
                let bestAction = actions[0];
                this.executeAction(villager, bestAction);
            }
        } else {
            // Continuar con la acción actual
            switch (villager.currentAction) {
                case 'eat':
                    this.executeEat(villager, villager.target);
                    break;
                case 'sleep':
                    this.executeSleep(villager, villager.target);
                    break;
                case 'socialize':
                    this.executeSocialize(villager, villager.target);
                    break;
                case 'court':
                    this.executeCourt(villager, villager.target);
                    break;
                case 'gather':
                    this.executeGather(villager, villager.target);
                    break;
                case 'explore':
                    this.executeExplore(villager, villager.target);
                    break;
                case 'flee':
                    this.executeFlee(villager, villager.target);
                    break;
                case 'defend':
                    this.executeDefend(villager, villager.target);
                    break;
                case 'heal':
                    this.executeHeal(villager, villager.target);
                    break;
                case 'pray':
                    this.executePray(villager, villager.target);
                    break;
                case 'build':
                    this.executeBuild(villager, villager.target);
                    break;
                case 'research':
                    this.executeResearch(villager, villager.target);
                    break;
            }
        }

        // Actualizar posición
        villager.x += villager.vx;
        villager.y += villager.vy;

        // Fricción
        villager.vx *= 0.9;
        villager.vy *= 0.9;

        // Decaimiento de energía
        if (villager.currentAction !== 'sleep') {
            villager.energy = Math.max(0, villager.energy - 0.01);
        }

        // Decaimiento de hambre
        villager.hunger = Math.max(0, villager.hunger - 0.005);

        // Decaimiento social
        v.social = Math.max(0, v.social - 0.002);

        // Envejecimiento
        v.age += 0.0001;

        // Muerte por vejez
        if (v.age > 80) {
            v.alive = false;
            G.log(`💀 ${v.name} murió de vejez`);
        }

        // Muerte por hambre
        if (v.hunger <= 0) {
            v.hp -= 0.1;
            if (v.hp <= 0) {
                v.alive = false;
                G.log(`💀 ${v.name} murió de hambre`);
            }
        }
    }
};

console.log('[WK] AI Engine cargado');