// components (data):
const Position = (x, y) => ({ x, y });
const Velocity = (dx, dy) => ({ dx, dy });
const Gravity = (value) => ({ value });
const Collider = (width, height) => ({ width, height });

// entities (groups of components):
const Bird = () => ({});
const Pipe = () => ({});

// systems (functions):

// gravity system:
// applies gravity to entities
const applyGravity = (entites) =>
  entites.map((entity) => {
    if (entity.Gravity && entity.Velocity) {
      return {
        ...entity,
        Velocity: {
          // x velocity stays the same
          dx: entity.Velocity.dx,
          // y velocity is affected by gravity
          dy: entity.Velocity.dy + entity.Gravity.value,
        },
      };
    }

    return entity;
  });

// positioning system:
// applies velocity to entities
const updatePosition = (entities) =>
  entities.map((entity) => {
    if (entity.Position && entity.Velocity) {
      return {
        ...entity,
        Position: {
          // both x and y are updated
          x: entity.Position.x + entity.Velocity.dx,
          y: entity.Position.y + entity.Velocity.dy,
        },
      };
    }

    return entity;
  });

// input system:
// handles input and applies
// velocity to the bird
const handleInput = (entities, input) =>
  entities.map((entity) => {
    if (entity.Bird && input === "FLAP") {
      return {
        ...entity,
        Velocity: {
          // dx stays the same
          dx: entity.Velocity.dx,
          // dy is changed
          dy: -4,
        },
      };
    }

    // if entity is not bird, do nothing
    return entity;
  });

// input listener
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") gameState = handleInput(gameState, "FLAP");
});

// pipe systems:
// generates pipes
const generatePipes = (entities, frameCount) => {
  // generates new pipe every 150 frames
  if (frameCount % 150 === 0) {
    const gap = 150; // gap between the pipes
    const pipeHeight = Math.random() * (400 - gap) + 50;
    const topPipe = createEntity(2, {
      Position: Position(800, pipeHeight - 400),
      Collider: Collider(50, 400),
      Pipe: Pipe(),
    });
    const bottomPipe = createEntity(3, {
      Position: Position(800, pipeHeight + gap),
      Collider: Collider(50, 400),
      Pipe: Pipe(),
    });
    return [...entities, topPipe, bottomPipe];
  }

  return entities;
};

// moves pipes from right to left
const movePipes = (entities) =>
  entities.map((entity) => {
    if (entity.Pipe && entity.Position) {
      return {
        ...entity,
        Position: {
          // x is changed
          x: entity.Position.x - 2,
          // y stays the same
          y: entity.Position.y,
        },
      };
    }

    // if entity is not pipe, do nothing
    return entity;
  });

// removes offscreen pipes
const removeOffscreenPipes = (entities) =>
  entities.filter((entity) => !(entity.Pipe && entity.Position.x + 50 < 0));

// collision detection system:
const detectCollision = (entities) => {
  const bird = entities.find((entity) => entity.Bird);
  if (!bird) return false;

  // bird's center (bird position)
  const { x: bx, y: by } = bird.Position;
  // collider represents the bird's radius
  const { width: bw, height: bh } = bird.Collider;
  // assuming width and height are equal for a circular bird
  const radius = bw / 2;

  // checks if the bird goes out of bounds vertically
  if (by - radius < 0 || by + radius > 600) {
    return true; // collision with the top or bottom of the screen
  }

  // checks collision with pipes
  return entities.some((entity) => {
    if (entity.Pipe) {
      const { x: px, y: py } = entity.Position; // top-left corner of the pipe
      const { width: pw, height: ph } = entity.Collider; // pipe dimensions

      // finds the closest point on the rectangle to the circle
      const closestX = Math.max(px, Math.min(bx, px + pw));
      const closestY = Math.max(py, Math.min(by, py + ph));

      // calculates the distance from the bird's center to this point
      const distanceX = bx - closestX;
      const distanceY = by - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;

      // checks if distance is less than or
      // equal to the bird's radius squared
      return distanceSquared <= radius * radius;
    }
    return false;
  });
};

// scoring system:
// increments score when bird passes a pipe
const updateScore = (entities) => {
  const bird = entities.find((entity) => entity.Bird);
  if (!bird) return entities;

  return entities.map((entity) => {
    // only considers top pipes (pipes with y < 0
    // or logically positioned as the upper pipe)
    if (entity.Pipe && !entity.passed && entity.Position.y < 0) {
      const birdX = bird.Position.x;
      const pipeX = entity.Position.x + entity.Collider.width;

      // checks if bird has passed the pipe
      if (birdX > pipeX) {
        score += 1; // increments global score
        return { ...entity, passed: true }; // marks pipe as passed
      }
    }

    // if entity is not pipe or has already been passed, do nothing
    return entity;
  });
};

// rendering system:
// renders entities
const render = (entities) => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // clears the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // renders entities
  entities.forEach((entity) => {
    if (entity.Bird) {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(entity.Position.x, entity.Position.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    if (entity.Pipe) {
      ctx.fillStyle = "green";
      ctx.fillRect(entity.Position.x, entity.Position.y, 50, 400);
    }
  });

  // renders the score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
};

// entity factory:
// takes id and components and creates
// an entity (object) out of them
const createEntity = (id, components) => ({ id, ...components });

// creates a bird entity
const createBird = () =>
  createEntity(1, {
    Position: Position(100, 250),
    Gravity: Gravity(0.125),
    Velocity: Velocity(0, 0),
    Collider: Collider(20, 20),
    Bird: Bird(),
  });

// game variables:
let gameState = [createBird()];
let frameCount = 0;
let score = 0;

// resets game variables:
const resetGame = () => {
  frameCount = 0;
  score = 0;
  gameState = [createBird()];
};

// game loop:
const gameLoop = () => {
  frameCount++;

  const systems = [
    applyGravity,
    updatePosition,
    movePipes,
    removeOffscreenPipes,
    updateScore,
  ];

  gameState = systems.reduce((state, system) => system(state), gameState);
  gameState = generatePipes(gameState, frameCount);

  if (detectCollision(gameState)) {
    alert("Game Over! Press OK or Space to start a new game.");
    resetGame();
    gameLoop();
    return;
  }

  render(gameState);
  requestAnimationFrame(gameLoop);
};

gameLoop();
