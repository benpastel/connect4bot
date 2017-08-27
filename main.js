let WAITING_FOR_INPUT = false;

function onClick(e) {
	if (!WAITING_FOR_INPUT) return;

	if (global_game_over) throw "Error: game already over";

    let x = e.pageX;
    let y = e.pageY;

    if (x > MAX_BOARD_X || y > MAX_BOARD_Y || x < ORIGIN_X) {
    	// off the board; ignore
		return;
    }

	let col = Math.floor((x - ORIGIN_X) / SQUARE_SIDE);
	if (col < 0 || col >= N_COLS) {
		throw "invalid column";
	} 

	let row;
	for (row = 0; row < N_ROWS; row++) {
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

function end(result_check) {
	global_game_over = true;
		
	if (result_check.result === RESULT.DRAW) {
		message("DRAW!");
		return;
	}
		
	let start = toPixels(result_check.squares[0].row, result_check.squares[0].col);
	let end = toPixels(result_check.squares[3].row, result_check.squares[3].col);
	let path = paper.path(
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
			let move = choose_move(global_player, global_board);
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

	const color = (global_player === YELLOW ? "#ff0" : "#f00");

	updateDisplay(row, col, color, function () {
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

