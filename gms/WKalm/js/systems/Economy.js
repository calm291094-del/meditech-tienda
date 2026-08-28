// ============================================================
// ECONOMY.JS
// Sistema económico completo: negocios, oro, impuestos, clientes
// ============================================================

window.Economy = {

  // Impuestos globales (porcentaje que va al pueblo)
  taxRate: 0.15,

  // Lista de negocios activos
  businesses: [],

  // Inicializar economía
  init(sim) {
    this.businesses = [];
    this.nextBusinessId = 1;
  },

  // ------------------------------------------------------------
  // Crear un nuevo negocio
  // ------------------------------------------------------------
  createBusiness(buildingDef, owner, x, y) {
    const business = {
      id: this.nextBusinessId++,
      buildingId: buildingDef.id,
      name: buildingDef.name,
      emoji: buildingDef.emoji,
      ownerId: owner.id,
      ownerName: owner.name,
      x, y,
      
      gold: 50,              // Oro inicial del negocio
      reputation: 50,        // Reputación (0-100)
      level: 1,
      stock: {},             // Inventario del negocio
      employees: [],         // IDs de NPCs empleados
      
      // Estadísticas
      dailyIncome: 0,
      dailyExpenses: 0,
      totalProfit: 0,
      customersToday: 0,
      
      // Producción
      productionTimer: 0,
      productionRate: buildingDef.rate || 1,
      produces: buildingDef.produces,
      
      // Precios dinámicos
      prices: this.calculatePrices(buildingDef)
    };

    this.businesses.push(business);
    return business;
  },

  // ------------------------------------------------------------
  // Calcular precios basados en oferta/demanda
  // ------------------------------------------------------------
  calculatePrices(buildingDef) {
    const prices = {};
    const goods = ContentDB.goods || [];
    
    goods.forEach(good => {
      prices[good.id] = good.basePrice;
    });
    
    return prices;
  },

  // ------------------------------------------------------------
  // Encontrar negocio por ID
  // ------------------------------------------------------------
  getById(id) {
    return this.businesses.find(b => b.id === id) || null;
  },

  // ------------------------------------------------------------
  // Encontrar negocio cercano a una posición
  // ------------------------------------------------------------
  findNearest(x, y, type = null, maxDist = 500) {
    let best = null, bestDist = maxDist;
    
    for (const biz of this.businesses) {
      if (type && biz.buildingId !== type) continue;
      
      const d = Phaser.Math.Distance.Between(x, y, biz.x, biz.y);
      if (d < bestDist) {
        bestDist = d;
        best = biz;
      }
    }
    
    return best;
  },

  // ------------------------------------------------------------
  // Encontrar mejor negocio para un NPC según su profesión
  // ------------------------------------------------------------
  findJobForNpc(npc) {
    const profId = npc.profession?.id;
    if (!profId) return null;

    for (const biz of this.businesses) {
      const buildingDef = ContentDB.findById(ContentDB.buildings, biz.buildingId);
      if (!buildingDef) continue;
      
      if (buildingDef.profession !== profId) continue;
      if (biz.employees.length >= (buildingDef.capacity || 2)) continue;
      
      return biz;
    }
    
    return null;
  },

  // ------------------------------------------------------------
  // Contratar NPC en un negocio
  // ------------------------------------------------------------
  hire(business, npc) {
    if (business.employees.includes(npc.id)) return false;
    
    business.employees.push(npc.id);
    npc.job = {
      businessId: business.id,
      role: npc.profession?.name || 'Trabajador',
      salary: this.calculateSalary(npc)
    };
    
    return true;
  },

  // ------------------------------------------------------------
  // Calcular salario según profesión y nivel
  // ------------------------------------------------------------
  calculateSalary(npc) {
    const base = 5;
    const profBonus = npc.profession?.id === 'merchant' ? 3 : 1;
    return Math.floor(base * profBonus);
  },

  // ------------------------------------------------------------
  // Pagar salarios (llamado al final del día)
  // ------------------------------------------------------------
  paySalaries(business, sim) {
    let totalSalaries = 0;
    
    for (const empId of business.employees) {
      const npc = sim.getById(empId);
      if (!npc || !npc.alive || !npc.job) continue;
      
      const salary = npc.job.salary || 5;
      totalSalaries += salary;
      
      // Pagar al NPC
      npc.gold = (npc.gold || 0) + salary;
    }
    
    // Descontar del negocio
    business.gold -= totalSalaries;
    business.dailyExpenses += totalSalaries;
    
    return totalSalaries;
  },

  // ------------------------------------------------------------
  // Producción del negocio
  // ------------------------------------------------------------
  produce(business, dt, sim) {
    if (!business.produces || business.productionRate <= 0) return;
    
    business.productionTimer += dt;
    
    const interval = 10 / business.productionRate; // segundos
    
    if (business.productionTimer >= interval) {
      business.productionTimer = 0;
      
      // Factor de empleados (más empleados = más producción)
      const employeeMult = 1 + (business.employees.length * 0.3);
      const amount = 1 * employeeMult;
      
      if (business.produces === 'gold') {
        business.gold += amount;
        business.dailyIncome += amount;
      } else {
        // Agregar al stock global
        sim.addStock(business.produces, amount);
        business.dailyIncome += amount * (business.prices[business.produces] || 5);
      }
    }
  },

  // ------------------------------------------------------------
  // Cliente visita el negocio
  // ------------------------------------------------------------
  customerVisit(business, customer) {
    if (!customer || !customer.alive) return;
    
    business.customersToday++;
    
    // Cliente gasta algo de oro
    const spend = Phaser.Math.Between(2, 8);
    if ((customer.gold || 0) >= spend) {
      customer.gold -= spend;
      business.gold += spend * (1 - this.taxRate);
      business.dailyIncome += spend;
      
      // Impuestos van al stock global de oro
      if (business.sim) {
        business.sim.addStock('gold', spend * this.taxRate);
      }
    }
    
    // Mejorar reputación
    business.reputation = Math.min(100, business.reputation + 0.1);
  },

  // ------------------------------------------------------------
  // Update diario (resetear contadores)
  // ------------------------------------------------------------
  onNewDay(business) {
    business.totalProfit += business.dailyIncome - business.dailyExpenses;
    business.dailyIncome = 0;
    business.dailyExpenses = 0;
    business.customersToday = 0;
  },

  // ------------------------------------------------------------
  // Update principal
  // ------------------------------------------------------------
  update(dt, sim) {
    for (const biz of this.businesses) {
      this.produce(biz, dt, sim);
      biz.sim = sim; // referencia para impuestos
    }
  }
};