const N_ROWS = 6;
const N_COLS = 7;

const global_board = new Uint8Array(N_ROWS * N_COLS);

// fast checks rely on these exact values
const YELLOW = 1;
const RED = 10; 

var global_player = YELLOW;
var global_game_over = false;

function reset_shared_state() {
	global_player = YELLOW;
	global_game_over = false;
	for (var i = 0; i<global_board.length; i++) {
		global_board[i] = 0;
	}
}

// TODO: set via UI
function is_bot(player) {
	return global_player === YELLOW ? false : true;
}
function other(player) {
	return player === YELLOW ? RED : YELLOW;
}

function Point(row, col) {
	this.row = row;
	this.col = col;
}
Point.prototype.toString = function pointToString() {
	return " (" + this.row + "," + this.col + ") ";
}

// a board where each square is a pointer to the slices that square belongs to
// a slice is a line of squares that includes this square
const slice_lookup = [];
function init_slices() {
	const row_lookup = [];
	const col_lookup = [];
	const asc_lookup = [];
	const desc_lookup = [];

	// rows
	for (var row = 0; row < N_ROWS; row++) {
		var slice = [];
		for (var col = 0; col < N_COLS; col++) {
			slice.push(new Point(row, col));
			row_lookup[row + col * N_ROWS] = slice;
		}
	}

	// columns
	for (var col = 0; col < N_COLS; col++) {
		var slice = [];
		for (var row = 0; row < N_ROWS; row++) {
			slice.push(new Point(row, col));
			col_lookup[row + col * N_ROWS] = slice; 
		}
	}
	
	// ascending diagonals
	// get all the ones that hit the left wall
	for (var start_row = 0; start_row < N_ROWS; start_row++) {
		var slice = [];
		var row = start_row;
		var col = 0;
		while (col < N_COLS && row < N_ROWS) {
			slice.push(new Point(row, col));
			asc_lookup[row + col * N_ROWS] = slice;
			row++;
			col++;
		}
	}
	// get all the ones that hit the bottom. don't double count the one overlap
	for (var start_col = 1; start_col < N_COLS; start_col++) {
		var slice = [];
		var row = 0;
		var col = start_col;
		while (col < N_COLS && row < N_ROWS) {
			slice.push(new Point(row, col));
			asc_lookup[row + col * N_ROWS] = slice;
			row++;
			col++;
		}
	}

	// descending diagonals
	// get all the ones that hit the left wall
	for (var start_row = 0; start_row < N_ROWS; start_row++) {
		var slice = [];
		var row = start_row;
		var col = 0;
		while (row >= 0 && col < N_COLS) {
			slice.push(new Point(row, col));
			desc_lookup[row + col * N_ROWS] = slice;
			row--;
			col++;
		}
	}
	// get all the ones that hit the top. don't double count the one overlap.
	for (var start_col = 1; start_col < N_COLS; start_col++) {
		var slice = [];
		var row = N_ROWS-1;
		var col = start_col;
		while (row >= 0 && col < N_COLS) {
			slice.push(new Point(row, col));
			desc_lookup[row + col * N_ROWS] = slice;
			row--;
			col++;
		}
	}

	// package up the results for each square
	for (var idx = 0; idx < N_ROWS * N_COLS; idx++) {
		slice_lookup[idx] = [
			row_lookup[idx],
			col_lookup[idx],
			asc_lookup[idx],
			desc_lookup[idx]
		];
	}
}
init_slices();

function isFilled(board) {
	for (var idx = N_ROWS-1; idx < board.length; idx += N_ROWS) {
		if (!board[idx]) {
			return false;
		}
	}
	return true;
}
const RESULT = {
	CONTINUE : 0,
	YELLOW_WINS : 1,
	RED_WINS : 2,
	DRAW : 3
};
function check_result(row, col, board) {
	return check_result_with_squares(row, col, board).result;
}
// in the case of a win, also includes the winning squares
function check_result_with_squares(row, col, board) {
	const slices = slice_lookup[row + col*N_ROWS];

	for (var s=0; s<slices.length; s++) {
		var slice = slices[s];

		for (var i = 0; i < slice.length - 3; i++) {
			var sum = 
				board[slice[i].row + slice[i].col * N_ROWS] + 
				board[slice[i+1].row + slice[i+1].col * N_ROWS] + 
				board[slice[i+2].row + slice[i+2].col * N_ROWS] + 
				board[slice[i+3].row + slice[i+3].col * N_ROWS];

			if (sum === 4) {
				return {
					result: RESULT.YELLOW_WINS,
					squares: [slice[i], slice[i+1], slice[i+2], slice[i+3]]
				};
			} 
			if (sum === 40) {
				return {
					result: RESULT.RED_WINS,
					squares: [slice[i], slice[i+1], slice[i+2], slice[i+3]]
				};
			}
		}
	}
	return {
		result: isFilled(board) ? RESULT.DRAW : RESULT.CONTINUE,
		squares: null
	};
}

function board_to_string(board) {
	var string = "\n";
	for (var row = N_ROWS-1; row >= 0; row--) {
		for (var col = 0; col < N_COLS; col++) {
			var val = board[row + col * N_ROWS];
			if (val === YELLOW) {
				string += "Y\t"; 
			} else if (val === RED) {
				string += "R\t";
			} else {
				string += ".\t";
			}
		}
		string += "\n";
	}
	return string;
}
