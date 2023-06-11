const CELL_SIZE = 20;

var cols = 0;
var rows = 0;

var nodes = {};

var cellsToUpdate = [];

var startCell = -1;
var targetCell = -1;

$(document).ready(function () {
    const body = $("body");
    const maxCols = Math.floor((body.width() - 20) / CELL_SIZE);
    const maxRows = Math.floor((body.height() - 80) / CELL_SIZE);
    cols = Math.min(maxCols, 80);
    rows = Math.min(maxRows, 80);

    const mazeContainer = $("#maze");
    mazeContainer.width(cols * CELL_SIZE);

    createGrid();
});

function createGrid() {
    for (let i = 0; i < cols * rows; i++) {
        $("#maze").append("<div id='" + i + "' class='cell'/>");

        nodes[i] = { isWall: false, neighbors: [] };

        if (i >= cols) {
            const top = i - cols;
            nodes[top].neighbors.push(i);
            nodes[i].neighbors.push(top);
        }

        if (i % cols != 0) {
            const left = i - 1;
            nodes[left].neighbors.push(i);
            nodes[i].neighbors.push(left);
        }
    }
}

function onResetClick() {
    $("#resolve-btn").attr("disabled", true);

    nodes = {};
    cellsToUpdate = [];
    startCell = -1;
    targetCell = -1;

    $("#maze").empty();
    createGrid();

    $("#generate-btn").attr("disabled", false);
    $("#reset-btn").attr("disabled", true);
}

async function onGenerateClick() {
    $("#generate-btn").attr("disabled", true);
    $("#reset-btn").attr("disabled", true);

    generateMaze();
    await updateCellsAsync(cellsToUpdate);

    $("#resolve-btn").attr("disabled", false);
    $("#reset-btn").attr("disabled", false);
}

function generateMaze() {
    for (let x = 0; x < cols; x++) {
        setWall(x, 0);
        setWall(x, rows - 1);
    }

    for (let y = 0; y < rows; y++) {
        setWall(0, y);
        setWall(cols - 1, y);
    }

    recursiveDivision(1, 1, cols - 1, rows - 1);

    setStartAndTargetCells();
}

function recursiveDivision(x, y, maxX, maxY) {
    const width = maxX - x;
    const height = maxY - y;

    if (width <= 2 && height <= 2) {
        return;
    }

    const horizontal = width != height ? width < height : Math.random() < 0.5;

    let wallX = horizontal ? x : randomRange(x, maxX, false);
    let wallY = horizontal ? randomRange(y, maxY, false) : y;

    const passageX = horizontal ? randomRange(wallX, maxX, true) : wallX;
    const passageY = horizontal ? wallY : randomRange(wallY, maxY, true);

    while (wallX < maxX && wallY < maxY) {
        if (wallX != passageX || wallY != passageY) {
            setWall(wallX, wallY);
        }

        if (horizontal) {
            wallX++;
        } else {
            wallY++;
        }
    }

    recursiveDivision(x, y, horizontal ? maxX : wallX, horizontal ? wallY : maxY);
    recursiveDivision(horizontal ? x : wallX + 1, horizontal ? wallY + 1 : y, maxX, maxY);
}

function setWall(x, y) {
    const cell = y * cols + x;
    nodes[cell].isWall = true;
    cellsToUpdate.push(cell);
}

function setStartAndTargetCells() {
    startCell = getRandomCell();
    cellsToUpdate.push(startCell);

    targetCell = getRandomCell(startCell);
    cellsToUpdate.push(targetCell);
}

function getRandomCell(exclude = -1) {
    var cell;

    do {
        cell = randomInt(cols * rows);
    } while (cell == exclude || nodes[cell].isWall);

    return cell;
}

function updateCellsAsync() {
    return new Promise((resolve, reject) => {
        updateCells(cellsToUpdate, resolve);
    });
}

function updateCells(cells, resolve) {
    if (cells.length <= 0) {
        resolve();
        return;
    }

    const cell = cells.shift();
    const classes = getClasses(cell);

    $("#" + cell).attr("class", classes);

    setTimeout(() => updateCells(cells, resolve), 1);
}

function getClasses(cell) {
    let classes = "cell";

    if (cell == startCell) {
        classes += " start";
    } else if (cell == targetCell) {
        classes += " target";
    } else if (nodes[cell].isWall) {
        classes += " wall";
    } else if (nodes[cell].partOfPath) {
        classes += " path";
    } else if (nodes[cell].visited) {
        classes += " visited";
    }

    return classes;
}

function randomRange(min, max, even) {
    if (min % 2 != even) min++;
    return min + randomInt((max - min) / 2) * 2;
}

function randomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

async function onFindPathClick() {
    $("#resolve-btn").attr("disabled", true);
    $("#reset-btn").attr("disabled", true);

    dfs();
    await updateCellsAsync(cellsToUpdate);

    findPath();
    await updateCellsAsync(cellsToUpdate);

    $("#reset-btn").attr("disabled", false);
}

function dfs() {
    var cellsToVisit = [startCell];
    var currentCell = startCell;

    while (currentCell != targetCell && cellsToVisit.length > 0) {
        currentCell = cellsToVisit.pop();

        nodes[currentCell].visited = true;
        cellsToUpdate.push(currentCell);

        for (let i = 0; i < nodes[currentCell].neighbors.length; i++) {
            const neighbor = nodes[currentCell].neighbors[i];
            if (!nodes[neighbor].visited && !nodes[neighbor].isWall) {
                cellsToVisit.push(neighbor);
                nodes[neighbor].previous = currentCell;
            }
        }
    }
}

function findPath() {
    var node = targetCell;

    while (node != startCell) {
        node = nodes[node].previous;
        nodes[node].partOfPath = true;
        cellsToUpdate.unshift(node);
    }
}
