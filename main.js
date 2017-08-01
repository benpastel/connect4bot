const SQUARE_SIDE = 80;
const ORIGIN_X = 10;
const ORIGIN_Y = 10;
const MAX_BOARD_X = ORIGIN_X + SQUARE_SIDE * N_COLS;
const MAX_BOARD_Y = ORIGIN_Y + SQUARE_SIDE * N_ROWS;
const paper = Raphael("board", 580, 560); 
console.log("Y: " + MAX_BOARD_Y)
console.log("X: " + MAX_BOARD_X)
// TODO: relative units to rescale gracefully on smaller browser window

const messageX = toPixels(-1, 3).x;
const messageY = toPixels(-1, 3).y;
const ANIMATION_MILLIS = 500;

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

// TODO: optional ATTRs into message
// smaller font for "click anywhere" statement
// little up arrows for instead of click anywhere
var global_last_message;
function message(string) {
	if (global_last_message) {
		global_last_message.remove();
	}
	global_last_message = paper.text(messageX, messageY, string)
		.attr({
			"font-family":"serif",
   			"font-style":"italic",
   			"font-size":"" + (SQUARE_SIDE / 2.0)});
	return global_last_message;
}

function onClick(e) {
	if (global_game_over) {
		return;
	}
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
	main_loop(row, col);
}

function updateDisplay(row, col, player) {
	console.log("updating display: " + [row, col, player]);

	var start_xy = toPixels(N_ROWS, col);
	var target_xy = toPixels(row, col);

	var circle = paper.circle(start_xy.x, start_xy.y, SQUARE_SIDE / 2.0 - 1); 
	var color = (player === YELLOW ? "#ff0" : "#f00");
	circle.attr("fill", color);
	circle.animate({cx: target_xy.x, cy: target_xy.y}, ANIMATION_MILLIS, "bounce");
}

function end(result_check) {
	global_game_over = true;
		
	if (result_check.result === RESULT.DRAW) {
		message("DRAW!").attr("fill", "#000");
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
		message("YELLOW WINS!")
			.attr("fill", "#ff0")
			.attr("stroke", "#000");
	} else {
		message("RED WINS!")
			.attr("fill", "#f00")
			.attr("stroke", "#000");
	}
}

function main_loop(row, col) {
	message("");
	global_board[row + col * N_ROWS] = global_player;
	updateDisplay(row, col, global_player);

	// sleep to let the animation run
	document.body.style.cursor = "progress";
	setTimeout(function() {
		const result_check = check_result_with_squares(row, col, global_board);
			if (result_check.result !== RESULT.CONTINUE) {
				end(result_check);
			}

		 	global_player = other(global_player);

		 	if (!global_game_over && is_bot(global_player)) {
		 		var move = choose_move(global_player, global_board);
		 		main_loop(move.row, move.col);
		 	}
		document.body.style.cursor = "default";
	}, ANIMATION_MILLIS + 100);
}

// TODO: wipe the pieces from the board
function restart() {
	console.log("restarting");
	reset_shared_state();
	reset_bot_state();
	paper.clear();
	initDisplay();
	message("new game");
}

initDisplay();
document.addEventListener("click", onClick);
message("click on a column to drop a piece");


