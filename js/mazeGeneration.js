// Generate a maze with x number of horizontal cells (cH) and vertical cells (cV)
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const generateMaze = (cH=3 , cV=4) => {

    const cellsHorizontal = cH;
    const cellsVertical = cV;
    const width = window.innerWidth;
    const height = window.innerHeight * .995 - window.innerHeight * .05; // window.innerHeight * .05 === 5vh
    const unitLengthX = width / cellsHorizontal;
    const unitLengthY = height / cellsVertical;

    const engine = Engine.create();
    engine.world.gravity.y = 0;
    const { world } = engine;
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false,
            width,
            height
        }
    });

    Render.run(render);
    Runner.run(Runner.create(), engine);

    // BORDER WALLS
    const walls = [
        Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true, friction: 0, render: { fillStyle: '#18181d'} }),
        Bodies.rectangle(width / 2, height, width, 2, { isStatic: true, friction: 0, render: { fillStyle: '#18181d'} }),
        Bodies.rectangle(0, height / 2, 2, height, { isStatic: true, friction: 0, render: { fillStyle: '#18181d'} }),
        Bodies.rectangle(width, height / 2, 2, height, { isStatic: true, friction: 0, render: { fillStyle: '#18181d'} })
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

    const grid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    const verticals = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal - 1).fill(false));

    const horizontals = Array(cellsVertical - 1)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontal);

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
            if (
                nextRow < 0 || 
                nextRow >= cellsVertical || 
                nextColumn < 0 || 
                nextColumn >= cellsHorizontal
            ) {
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
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                5,
                {
                    isStatic: true,
                    friction: 0,
                    label: 'wall',
                    render: {
                        fillStyle: '#ab0700'
                    }
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
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                5,
                unitLengthY,
                {
                    isStatic: true,
                    label: 'wall',
                    render: {
                        fillStyle: '#ab0700'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    // GOAL
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * .5,
        unitLengthY * .5,
        {
            isStatic: true,
            label: 'goal',
            render: {
                fillStyle: 'green'
            }
        }
    );

    World.add(world, goal);

    // BALL
    const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {
            friction: 0,
            label: 'ball',
            render: {
                fillStyle: 'blue'
            }
        }
    );

    World.add(world, ball);
    
    // Ball movement
    document.addEventListener('keydown', (event) => {
        const { x, y } = ball.velocity;

        if ( event.key === 'ArrowUp' || event.key === 'w') {
            Body.setVelocity(ball, { x, y: -3.5 });
        }
        if ( event.key === 'ArrowRight' || event.key === 'd') {
            Body.setVelocity(ball, { x: 3.5, y });
        }
        if ( event.key === 'ArrowDown' || event.key === 's') {
            Body.setVelocity(ball, { x, y: 3.5 });
        }
        if ( event.key === 'ArrowLeft' || event.key === 'a') {
            Body.setVelocity(ball, { x: -3.5, y });
        }
    });

    document.addEventListener('keyup', event =>{
        const {x, y} = ball.velocity;
        Body.setVelocity(ball, {x: 0, y: 0} )
    });

    // WIN CONDITION
    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach(collision => {
            const labels = ['ball', 'goal'];

            if (
                labels.includes(collision.bodyA.label) && 
                labels.includes(collision.bodyB.label)
            ) {
                document.querySelector('.winner').classList.remove('hidden');
                world.gravity.y = 1;
                world.bodies.forEach((body) => {
                    if (body.label === 'wall' || body.label === 'goal') {
                        Body.setStatic(body, false)
                    }
                });
            }
        });
    });

    const mazeClear = (event) => {
        event.preventDefault();
        World.clear(world);
        Engine.clear(engine);
        Render.stop(render);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }

    const easyBtn = document.querySelector('#easy');
    const normalBtn = document.querySelector('#normal');
    const hardBtn = document.querySelector('#hard');
    const crayBtn = document.querySelector('#cray');
    const reloadBtn = document.querySelector('#reload');
    const againBtn = document.querySelector('#again');

    easyBtn.addEventListener('click', (event) => {
        mazeClear(event);
        console.log('easy clicked');
        generateMaze(3, 4);
    });

    normalBtn.addEventListener('click', (event) => {
        mazeClear(event);
        console.log('normal clicked');
        generateMaze(6, 8);
    });

    hardBtn.addEventListener('click', (event) => {
        mazeClear(event);
        console.log('hard clicked');
        generateMaze(12, 16);
    });

    crayBtn.addEventListener('click', (event) => {
        mazeClear(event);
        console.log('cray cray clicked');
        generateMaze(24, 32);
    });

    reloadBtn.addEventListener('click', (event) => {
        mazeClear(event);
        
        switch(cellsHorizontal) {
            case 3 :
                generateMaze(3, 4);
                break;
            case 6 :
                generateMaze(6, 8);
                break;
            case 12 :
                generateMaze(12, 16);
                break;
            case 24 :
                generateMaze(24, 32);
                break;   
        }
    });

    againBtn.addEventListener('click', (event) => {
        mazeClear(event);
        document.querySelector('.winner').classList.add('hidden');
        switch(cellsHorizontal) {
            case 3 :
                generateMaze(3, 4);
                break;
            case 6 :
                generateMaze(6, 8);
                break;
            case 12 :
                generateMaze(12, 16);
                break;
            case 24 :
                generateMaze(24, 32);
                break;   
        }
    });
}
