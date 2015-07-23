const N_ROWS = 6;
const N_COLS = 7;

const global_board = new Uint8Array(N_ROWS * N_COLS);

// fast checks rely on these exact values
const YELLOW = 1;
const RED = 10; 

var global_player = YELLOW;
var global_game_over = false;
var global_moves = 0;

// TODO: set via UI
function is_bot(player) {
	return global_player === YELLOW ? false : true;
}
function other_player() {
	return global_player === YELLOW ? RED : YELLOW;
}

function Point(row, col) {
	this.row = row;
	this.col = col;
}
Point.prototype.toString = function pointToString() {
	return " (" + this.row + "," + this.col + ") ";
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
		row_squares.push(new Point(check_row, col));
	}

	var col_squares = []
	for (var row = 0; row < N_ROWS; row++) {
		col_squares.push(new Point(row, check_col));
	}

	var asc_diag = [];
	(function() {
		var min = Math.min(check_row, check_col);
		var row = check_row - min;
		var col = check_col - min;
		while (row < N_ROWS && col < N_COLS) {
			asc_diag.push(new Point(row, col));
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
			desc_diag.push(new Point(row, col));
			row++;
			col--;
		}
	})();
	return [
		row_squares, col_squares, asc_diag, desc_diag
	];
}

const RESULT = {
	CONTINUE : 0,
	YELLOW_WINS : 1,
	RED_WINS : 2,
	DRAW : 3
};
function check_result(row, col, board) {
	const sliced = slices(row, col, board);
	for (var s=0; s<sliced.length; s++) {
		var slice = sliced[s];
		var vals = slice.map(function(square){
			return get(square.row, square.col, board);
		});
		for (var i = 0; i < slice.length - 3; i++) {
			var sum = vals[i] + vals[i+1] + vals[i+2] + vals[i+3];
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

	// are all of the top rows full?
	for (var col = 0; col < N_COLS; col++) {
		if (get(N_ROWS-1, col, board) === 0) {
			break;
		}
	}
	if (col === N_COLS) { 
		return {
			result: RESULT.DRAW,
			squares: null
		};
	}
	return {
		result: RESULT.CONTINUE,
		squares: null
	};
}
