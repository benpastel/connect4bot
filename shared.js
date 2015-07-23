const N_ROWS = 6;
const N_COLS = 7;

const board = new Uint8Array(N_ROWS * N_COLS);
const YELLOW = 1;
const RED = 2;

var player = YELLOW;
var game_over = false;
var total_moves = 0;

// TODO: make these set via flags
function is_bot(player) {
	if (player === YELLOW) {
		return false;
	} else {
		return true;
	}
}

function get(row, col, board) {
	if (row < 0 || col < 0 || row >= N_ROWS || col >= N_COLS) {
		throw "index out of bounds " + [row, col];
	}
	return board[row + col * N_ROWS];
}
function set(val, row, col, board) {
	if (row < 0 || col < 0 || row >= N_ROWS || col >= N_COLS) {
		throw "index out of bounds " + [row, col];
	}
	if (val != 0 && val != YELLOW && val != RED) {
		throw "bad val " + val;
	}
	board[row + col * N_ROWS] = val;
}

// returns an array of slices
// where a slice is an array of points passing through 
// the original point
// 
// TODO: memoize?
function slices(check_row, check_col, board) {
	var row_squares = []
	for (var col = 0; col < N_COLS; col++) {
		row_squares.push([check_row, col]);
	}

	var col_squares = []
	for (var row = 0; row < N_ROWS; row++) {
		col_squares.push([row, check_col]);
	}

	var asc_diag = [];
	(function() {
		var min = Math.min(check_row, check_col);
		var row = check_row - min;
		var col = check_col - min;
		while (row < N_ROWS && col < N_COLS) {
			asc_diag.push([row, col]);
			row++;
			col++;
		}
	})();

	var desc_diag = [];
	(function() {
		var adjust = Math.min(check_row, (N_COLS - check_col - 1));
		var row = check_row - adjust;
		var col = check_col + adjust;
		while (row < N_ROWS && col >= 0) {
			desc_diag.push([row, col]);
			row++;
			col--;
		}
	})();
	return [
		row_squares, col_squares, asc_diag, desc_diag
	];
}
