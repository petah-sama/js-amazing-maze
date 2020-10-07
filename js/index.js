const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cells = 3;
const width = 600;
const height = 600;
const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: true,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// WALLS
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

// MAZE GENERATION
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

const grid = Array(cells)
    .fill(null)
    .map(() => Array(cells).fill(false));

const verticals = Array(cells)
    .fill(null)
    .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
    .fill(null)
    .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const visitCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if(grid[row][column]) {
        return;
    }

    // Mark this cell as being visited
    grid[row][column] = true;

    // For each neighbour...
    const neighbours = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    for (let neighbour of neighbours) {
        const [nextRow, nextColumn, direction] = neighbour;
        
        // See if that neighbour is out of bounds
        if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) {
            continue;
        }
        
        // If we have visited that neighbour continue to next neighbour
        if (grid[nextRow][nextColumn]) {
            continue;
        }

        // Remove a wall from either horizontals or verticals
        switch(direction) {
            case 'left':
                verticals[row][column -1] = true;
                break;
            case 'right':
                verticals[row][column] = true;
                break;
            case 'up':
                horizontals[row - 1][column] = true;
                break;
            case 'down':
                horizontals[row][column] = true;
                break;
        }

        // Visit that next cell
        visitCell(nextRow, nextColumn);
    }
}

visitCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength / 2,
            rowIndex * unitLength + unitLength,
            unitLength,
            5,
            {
                isStatic: true,
                label: 'wall'
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength,
            rowIndex * unitLength + unitLength / 2,
            5,
            unitLength,
            {
                isStatic: true,
                label: 'wall'
            }
        );
        World.add(world, wall);
    });
});

// GOAL
const goal = Bodies.rectangle(
    width - unitLength / 2,
    height - unitLength / 2,
    unitLength * .5,
    unitLength * .5,
    {
        isStatic: true,
        label: 'goal'
    }
);

World.add(world, goal);

// BALL
const ball = Bodies.circle(
    unitLength / 2,
    unitLength / 2,
    unitLength / 4,
    {
        label: 'ball'
    }
);

World.add(world, ball);

document.addEventListener('keydown', (event) => {
    const { x, y } = ball.velocity;

    if ( event.key === 'ArrowUp' || event.key === 'w') {
        Body.setVelocity(ball, { x, y: y - 5 });
    }
    if ( event.key === 'ArrowRight' || event.key === 'd') {
        Body.setVelocity(ball, { x: x + 5, y });
    }
    if ( event.key === 'ArrowDown' || event.key === 's') {
        Body.setVelocity(ball, { x, y: y + 5 });
    }
    if ( event.key === 'ArrowLeft' || event.key === 'a') {
        Body.setVelocity(ball, { x: x - 5, y });
    }
});

// WIN CONDITION

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
        ) {
            world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if (body.label === 'wall' || body.label === 'goal') {
                    Body.setStatic(body, false)
                }
            });
        }
    });
});