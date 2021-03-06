const STATES = {
	WAITING_FOR_INPUT : 0,
	BUSY : 1,
	// GAME_OVER : 2,
};
let global_state = STATES.BUSY;
let global_player = YELLOW;
let global_game_count = 0;

function is_bot(player) {
    const playerName = (player === YELLOW ? "yellowPlayer" : "redPlayer");
    const query = 'input[name=' + playerName + ']:checked';
    return "bot" === document.querySelector(query).value;
}

function other(player) {
    return player === YELLOW ? RED : YELLOW;
}

function onClick(e) {
	if (global_state !== STATES.WAITING_FOR_INPUT) return;

    const x = e.pageX;
    const y = e.pageY;

    if (x > MAX_BOARD_X || y > MAX_BOARD_Y || x < ORIGIN_X || y < ORIGIN_Y) {
    	// off the board; ignore
		return;
    }

	const col = Math.floor((x - ORIGIN_X) / SQUARE_SIDE);
	if (col < 0 || col >= N_COLS) {
		throw "invalid column";
	} 
	const row = first_open_row(col, global_board);
	if (row === null) {
		// column is full; ignore
		return;
	}
	global_state = STATES.BUSY;
	make_move(row, col);
}

function end(result_check) {
	global_state = STATES.BUSY;
		
	if (result_check.result === RESULT.DRAW) {
		message("DRAW!");
		return;
	}
	if (result_check.result === RESULT.YELLOW_WINS) {
		message("YELLOW WINS!");
	} else {
		message("RED WINS!");
	}
	afterAnimation(function() {
		drawWinLine(
			result_check.squares[0].row, result_check.squares[0].col,
			result_check.squares[3].row, result_check.squares[3].col)
	});
}

function get_next_move() {
	if (is_bot(global_player)) {
		global_state = STATES.BUSY;
		message("thinking...");
		afterAnimation(function() {
			const move = choose_move(global_player, global_board);
			make_move(move.row, move.col);
		});
	} else {
		message("your move!");
		global_state = STATES.WAITING_FOR_INPUT;
	}
}

function make_move(row, col) {
	global_board[row + col * N_ROWS] = global_player;

	const result_check = check_result_with_squares(row, col, global_board);
	const color = (global_player === YELLOW ? "#ff0" : "#f00");
	if (result_check.result !== RESULT.CONTINUE) {
		end(result_check);
	} else {
		global_player = other(global_player);
		get_next_move();
	}
	drawPieceDrop(row, col, color);
}

function new_game() {
	global_state = STATES.BUSY;
	global_player = YELLOW;
	global_game_count++;
	console.log("starting game " + global_game_count);
	reset_board();
	paper.clear();
	drawEmptyBoard();
	get_next_move();
}

function read_time_limit_ms(player) {
	const name = (player === YELLOW ? "yellowDifficulty" : "redDifficulty");
	return document.getElementById(name).value;
}
document.addEventListener("click", onClick);
new_game();

