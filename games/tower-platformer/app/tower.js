(function() { // private module pattern

  'use strict'

  //===========================================================================
  // CONSTANTS
  //===========================================================================

  var FPS           = 60,
      WIDTH         = 720,
      HEIGHT        = 540,
      HORIZON       = HEIGHT/5,
      METER         = HEIGHT/20,
      COL_WIDTH     = METER * 3,
      ROW_HEIGHT    = METER,
      ROW_SURFACE   = ROW_HEIGHT * 0.3,
      PLAYER_WIDTH  = METER * 1.5,
      PLAYER_HEIGHT = METER * 2,
      GROUND_SPEED  = 2,
      GRAVITY       = 9.8 * 4,
      MAXDX         = 10,
      MAXDY         = (ROW_SURFACE*FPS/METER),
      CLIMBDY       = 8,
      ACCEL         = 1/4,
      FRICTION      = 1/8,
      IMPULSE       = 15 * FPS,
      FALLING_JUMP  = FPS/5,
      LADDER_EDGE   = 0.6,
      COIN          = { W: ROW_HEIGHT, H: ROW_HEIGHT },
      DIR           = { NONE: 0, LEFT: 1, RIGHT: 2, UP: 3, DOWN: 4 },
      STEP          = { FRAMES: 8, W: COL_WIDTH/10, H: ROW_HEIGHT },
      KEY           = { SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 },
      IMAGES        = ['ground', 'ladder', 'player', 'monster', 'coins'],
      PLAYER        = { DEBUG: false,
        RIGHT: { x: 0,    y: 0, w: 72, h: 96, frames: 11, fps: 30 },
        STAND: { x: 792,  y: 0, w: 72, h: 96, frames: 1,  fps: 30 },
        LEFT:  { x: 1224, y: 0, w: 72, h: 96, frames: 11, fps: 30 },
        BACK:  { x: 2016, y: 0, w: 72, h: 96, frames: 1,  fps: 30 },
        CLIMB: { x: 2016, y: 0, w: 72, h: 96, frames: 11, fps: 30 },
        HURTL: { x: 1080, y: 0, w: 72, h: 96, frames: 1,  fps: 10 },
        HURTR: { x: 1152, y: 0, w: 72, h: 96, frames: 1,  fps: 10 }
      },
      MONSTERS = [
        { name: "BLOCK", nx: -0.5, ny: -0.5, w: 1.5*METER, h: 1.5*METER, speed: 4*METER, dir: 'up',    vertical: true,  horizontal: false, animation: { up:   { x:   0, y:  0, w: 50, h: 50, frames: 2, fps: 5 }, down:  { x:   0, y:  0, w: 50, h: 50, frames: 2, fps: 5 } } },
        { name: "FLY",   nx: -0.5, ny: -0.5, w: 1.5*METER, h: 1.0*METER, speed: 8*METER, dir: 'left',  vertical: false, horizontal: true,  animation: { left: { x: 100, y:  7, w: 76, h: 36, frames: 2, fps: 5 }, right: { x: 252, y:  7, w: 76, h: 36, frames: 2, fps: 5 } } },
        { name: "SLIME", nx: -0.5, ny:  0.0, w: 1.5*METER, h: 1.0*METER, speed: 4*METER, dir: 'right', vertical: false, horizontal: true,  animation: { left: { x: 404, y: 11, w: 50, h: 28, frames: 2, fps: 5 }, right: { x: 504, y: 11, w: 50, h: 28, frames: 2, fps: 5 } } },
        { name: "SNAIL", nx: -0.5, ny:  0.0, w: 1.5*METER, h: 1.0*METER, speed: 2*METER, dir: 'left',  vertical: false, horizontal: true,  animation: { left: { x: 604, y:  9, w: 58, h: 32, frames: 2, fps: 5 }, right: { x: 720, y:  9, w: 58, h: 32, frames: 2, fps: 5 } } }
      ];

  //===========================================================================
  // VARIABLES
  //===========================================================================

  var tower, monsters, camera, player, renderer;

  //===========================================================================
  // PATCHED RUN
  //===========================================================================

  function run() {
    Game.Load.images(IMAGES, function(images) {
      // PATCH: use getLevel instead of Game.Load.json
      getLevel("levels/demo.json", function(level) {
        setup(images, level);
        Game.run({
          fps:    FPS,
          update: update,
          render: render
        });
        Dom.on(document, 'keydown', function(ev) { return onkey(ev, ev.keyCode, true);  }, false);
        Dom.on(document, 'keyup',   function(ev) { return onkey(ev, ev.keyCode, false); }, false);
      });
    });
  }

  // ... rest of tower.js stays exactly the same (setup, update, render, Player, Tower, Monsters, Renderer, etc.)

  run();

})();
