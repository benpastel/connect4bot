const SQUARE_SIDE = 80;
const ORIGIN_X = 10;
const ORIGIN_Y = 10;
const MAX_BOARD_X = ORIGIN_X + SQUARE_SIDE * N_COLS;
const MAX_BOARD_Y = ORIGIN_Y + SQUARE_SIDE * N_ROWS;
const paper = Raphael("board", 580, 500); 
const ANIMATION_MILLIS = 500;

// pixels of the center of the square
function toPixels(row, col) {
    return {
        x: ORIGIN_X + (col + 0.5) * SQUARE_SIDE,
        y: ORIGIN_Y + (N_ROWS - row - 1 + 0.5) * SQUARE_SIDE
    }
}

function drawEmptyBoard() {
    for (let row = 0; row < N_ROWS+1; row++) {
        let y = ORIGIN_Y + row * SQUARE_SIDE;
        paper.path(
            "M" + ORIGIN_X + "," + y +
            "L" + (ORIGIN_X + SQUARE_SIDE * N_COLS) + "," + y);
    }
    for (let col = 0; col < N_COLS+1; col++) {
        let x = ORIGIN_X + col * SQUARE_SIDE;
        paper.path(
            "M" + x + "," + ORIGIN_Y + 
            "L" + x + "," + (ORIGIN_Y + SQUARE_SIDE * N_ROWS));
    }
}

// Queues an animation of a piece dropping.
function drawPieceDrop(row, col, color) {
    let start_xy = toPixels(N_ROWS, col);
    let target_xy = toPixels(row, col);
    let circle = paper.circle(start_xy.x, start_xy.y, SQUARE_SIDE / 2.0 - 1); 
    
    circle.attr("fill", color);
    circle.animate({cx: target_xy.x, cy: target_xy.y}, ANIMATION_MILLIS, "bounce");
}

// Queues drawing a dashed line.
function drawWinLine(start_row, start_col, end_row, end_col) {
    let start = toPixels(start_row, start_col);
    let end = toPixels(end_row, end_col);
    let path = paper.path(
        "M" + start.x + "," + start.y + 
        "L" + end.x + "," + end.y);
    path.attr("stroke-dasharray","-");
    path.attr("stroke-width", 4.0);
}

function message(string) {
    document.getElementById("message").innerHTML = string;
}

// pause for animation, then run the function unless the game has restarted
function afterAnimation(f) {
    let game_id = global_game_count;
    setTimeout(function() {
        if (global_game_count !== game_id) {
            // the game has restarted since we paused
            return;
        }
        f();
    }, ANIMATION_MILLIS + 20);
}
