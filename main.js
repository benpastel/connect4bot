const SQUARE_SIDE = 80;
const ORIGIN_X = 10;
const ORIGIN_Y = 10;
const MAX_BOARD_X = ORIGIN_X + SQUARE_SIDE * N_COLS;
const MAX_BOARD_Y = ORIGIN_Y + SQUARE_SIDE * N_ROWS;
const paper = Raphael("board", 580, 500); 
console.log("Y: " + MAX_BOARD_Y)
console.log("X: " + MAX_BOARD_X)
// TODO: relative units to rescale gracefully on smaller browser window

const messageX = toPixels(-1, 3).x;
const messageY = toPixels(-1, 3).y;
const ANIMATION_MILLIS = 500;

var WAITING_FOR_INPUT = false;

function initDisplay() {
	for (var row = 0; row < N_ROWS+1; row++) {
		var y = ORIGIN_Y + row * SQUARE_SIDE;
		paper.path(
			"M" + ORIGIN_X + "," + y +
			"L" + (ORIGIN_X + SQUARE_SIDE * N_COLS) + "," + y);
	}
	for (var col = 0; col < N_COLS+1; col++) {
		var x = ORIGIN_X + col * SQUARE_SIDE;
		paper.path(
			"M" + x + "," + ORIGIN_Y + 
			"L" + x + "," + (ORIGIN_Y + SQUARE_SIDE * N_ROWS));
	}
}

// pixels of the center of the square
function toPixels(row, col) {
	return {
		x: ORIGIN_X + (col + 0.5) * SQUARE_SIDE,
		y: ORIGIN_Y + (N_ROWS - row - 1 + 0.5) * SQUARE_SIDE
	}
}

function message(string) {
	document.getElementById("message").innerHTML = string;
}

function onClick(e) {
	if (!WAITING_FOR_INPUT) return;

	if (global_game_over) throw "Error: game already over";

    var x = e.pageX;
    var y = e.pageY;

    if (x > MAX_BOARD_X || y > MAX_BOARD_Y || x < ORIGIN_X) {
    	// off the board; ignore
		return;
    }

	var col = Math.floor((x - ORIGIN_X) / SQUARE_SIDE);
	if (col < 0 || col >= N_COLS) {
		throw "invalid column";
	} 

	for (var row = 0; row < N_ROWS; row++) {
		if (!global_board[row + col * N_ROWS]) {
			break;
		}
	}

	if (row === N_ROWS) {
		message("that column is filled");
		return;
	}
	make_move(row, col);
}

function updateDisplay(row, col, player, next_function) {
	console.log("updating display: " + [row, col, player]);

	var start_xy = toPixels(N_ROWS, col);
	var target_xy = toPixels(row, col);

	var circle = paper.circle(start_xy.x, start_xy.y, SQUARE_SIDE / 2.0 - 1); 
	var color = (player === YELLOW ? "#ff0" : "#f00");
	circle.attr("fill", color);
	circle.animate({cx: target_xy.x, cy: target_xy.y}, ANIMATION_MILLIS, 
		"bounce", next_function);
}

function end(result_check) {
	global_game_over = true;
		
	if (result_check.result === RESULT.DRAW) {
		message("DRAW!");
		return;
	}
		
	var start = toPixels(result_check.squares[0].row, result_check.squares[0].col);
	var end = toPixels(result_check.squares[3].row, result_check.squares[3].col);
	var path = paper.path(
		"M" + start.x + "," + start.y + 
		"L" + end.x + "," + end.y);
	path.attr("stroke-dasharray","-");
	path.attr("stroke-width", 4.0);

	if (result_check.result === RESULT.YELLOW_WINS) {
		message("YELLOW WINS!");
	} else {
		message("RED WINS!");
	}
}

function get_next_move() {
	if (is_bot(global_player)) {
		WAITING_FOR_INPUT = false;
		message("thinking...");
		// run in callback to let the UI update
		setTimeout(function() {
			var move = choose_move(global_player, global_board);
			make_move(move.row, move.col);
		}, 50);
	} else {
		message("your move!");
		WAITING_FOR_INPUT = true;
	}
}

function make_move(row, col) {
	message("<br\>");
	global_board[row + col * N_ROWS] = global_player;

	// updateDisplay waits for the animation to finish and then runs a callback
	// make sure we aren't interrupted by more human input
	WAITING_FOR_INPUT = false;

	updateDisplay(row, col, global_player, function () {
		const result_check = check_result_with_squares(row, col, global_board);
		if (result_check.result !== RESULT.CONTINUE) {
			end(result_check);
		} else {
			global_player = other(global_player);
			get_next_move();
		}
	})
}

function new_game() {
	console.log("new game");
	reset_shared_state();
	reset_bot_state();
	paper.clear();
	initDisplay();
	get_next_move();
}

function read_time_limit_ms(player) {
	const name = (player === YELLOW ? "yellowDifficulty" : "redDifficulty");
	return document.getElementById(name).value;
}

document.addEventListener("click", onClick);
new_game();

