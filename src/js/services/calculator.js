export const Calculator = {
  getEffectiveLayer: (baseCm, corrections) => {
    if (!corrections?.enabled) return baseCm;
    return baseCm + (corrections.globalMm / 10) + (corrections.perRoomMm / 10);
  },
  
  calcRooms: (rooms, corrections) => {
    let totalArea = 0, totalVolume = 0, totalIndex = 0;
    rooms.forEach(r => {
      const area = parseFloat(r.area) || 0;
      const layer = Calculator.getEffectiveLayer(parseFloat(r.layer) || 0, corrections);
      if (area > 0) { totalArea += area; totalIndex += area * layer; }
    });
    const avgLayer = totalArea > 0 ? totalIndex / totalArea : 0;
    return { totalArea, avgLayer, totalVolume: totalArea * (avgLayer / 100), totalIndex };
  },
  
  calcCost: (area, layer, settings) => {
    const mixKg = area * layer * settings.mixDensity;
    const sandKg = mixKg * (settings.ratio / (settings.ratio + 1));
    const cemKg = mixKg * (1 / (settings.ratio + 1));
    const sandB = Math.ceil(sandKg / settings.sandBagW);
    const cemB = Math.ceil(cemKg / settings.cementBagW);
    const fibKg = (area * settings.fiberG) / 1000;
    
    const costs = {
      sand: sandB * settings.sandPrice,
      cement: cemB * settings.cementPrice,
      fiber: fibKg * settings.fiberPrice,
      film: area * settings.filmPrice,
      mesh: area * settings.meshPrice,
      labor: area * settings.laborPrice
    };
    
    const totalTons = (sandKg + cemKg) / 1000;
    const trips = Math.ceil(totalTons / settings.truckCap);
    const logistics = {
      delivery: trips * settings.deliveryPrice,
      lift: Math.ceil(totalTons) * settings.liftPrice
    };
    
    const total = Object.values(costs).reduce((a,b)=>a+b,0) + Object.values(logistics).reduce((a,b)=>a+b,0);
    
    return {
      ...costs, ...logistics, total, pricePerM2: total / area,
      details: { sandB, cemB, fibKg, totalTons, trips }
    };
  }
};
console.log('✅ Calculator loaded');
