// ============================================================
// MAIN.JS
// Arranca Phaser 3 con detección automática de móvil/escritorio
// ============================================================

window.addEventListener('load', () => {

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                   || (window.innerWidth <= 900 && 'ontouchstart' in window);

  // Tamaño base: usar el de la ventana
  const baseWidth = window.innerWidth;
  const baseHeight = window.innerHeight;

  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: baseWidth,
    height: baseHeight,
    backgroundColor: '#020617',

    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%'
    },

    scene: [
      BootScene,
      WorldScene,
      MinimapScene,
      HUDScene,
      EconomyScene,
      PowersScene,
      TechScene,
      AchievementsScene,
      NpcModalScene,
      AnimalModalScene,  // ← NUEVO
      WeaponModalScene   // ← NUEVO
    ],

    input: {
      mouse: { preventDefaultDown: false, preventDefaultUp: false, preventDefaultMove: false, preventDefaultWheel: false },
      touch: { capture: true },
      activePointers: 3
    },

    banner: {
      background: '#020617',
      text: '#fbbf24'
    }
  };

  const game = new Phaser.Game(config);
  window.game = game;
  window.isMobile = isMobile;

  // Guardar tipo de dispositivo en el registry
  game.registry.set('isMobile', isMobile);

  // Forzar audio tras primer gesto (política navegador)
  const resumeAudio = () => {
    if (game && game.sound && game.sound.context) {
      game.sound.context.resume().catch(() => {});
    }
    document.removeEventListener('click', resumeAudio);
    document.removeEventListener('touchstart', resumeAudio);
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('touchstart', resumeAudio, { passive: true });

  // Prevenir zoom con doble-tap en iOS
  document.addEventListener('gesturestart', e => e.preventDefault());
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  console.log(`[WorlKalm] Phaser 3 iniciado | Móvil: ${isMobile} | ${baseWidth}x${baseHeight}`);
});