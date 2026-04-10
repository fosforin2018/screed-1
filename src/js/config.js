export const Config = {
  appName: 'Стяжка Pro',
  version: '2.0.0',
  storageKey: 'screed_final',
  folderName: 'Screed1',
  defaultSettings: {
    sandBagW: 40, sandPrice: 150,
    cementBagW: 25, cementPrice: 350,
    ratio: 3, mixDensity: 20,
    truckCap: 5, deliveryPrice: 4000, liftPrice: 800,
    fiberG: 50, fiberPrice: 450,
    filmPrice: 25, meshPrice: 80,
    laborPrice: 450,
    logoUrl: '', masterName: ''
  }
};
console.log(`✅ ${Config.appName} v${Config.version} config loaded`);
