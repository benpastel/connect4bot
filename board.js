const N_ROWS = 6;
const N_COLS = 7;

const global_board = new Uint8Array(N_ROWS * N_COLS);

// optimized checks for 4-in-a-row rely on these exact values
const YELLOW = 1;
const RED = 10; 

function reset_board() {
	for (let i = 0; i<global_board.length; i++) {
		global_board[i] = 0;
	}
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
	for (let row = 0; row < N_ROWS; row++) {
		let slice = [];
		for (let col = 0; col < N_COLS; col++) {
			slice.push(new Point(row, col));
			row_lookup[row + col * N_ROWS] = slice;
		}
	}

	// columns
	for (let col = 0; col < N_COLS; col++) {
		let slice = [];
		for (let row = 0; row < N_ROWS; row++) {
			slice.push(new Point(row, col));
			col_lookup[row + col * N_ROWS] = slice; 
		}
	}
	
	// ascending diagonals
	// get all the ones that hit the left wall
	for (let start_row = 0; start_row < N_ROWS; start_row++) {
		let slice = [];
		let row = start_row;
		let col = 0;
		while (col < N_COLS && row < N_ROWS) {
			slice.push(new Point(row, col));
			asc_lookup[row + col * N_ROWS] = slice;
			row++;
			col++;
		}
	}
	// get all the ones that hit the bottom. don't double count the one overlap
	for (let start_col = 1; start_col < N_COLS; start_col++) {
		let slice = [];
		let row = 0;
		let col = start_col;
		while (col < N_COLS && row < N_ROWS) {
			slice.push(new Point(row, col));
			asc_lookup[row + col * N_ROWS] = slice;
			row++;
			col++;
		}
	}

	// descending diagonals
	// get all the ones that hit the left wall
	for (let start_row = 0; start_row < N_ROWS; start_row++) {
		let slice = [];
		let row = start_row;
		let col = 0;
		while (row >= 0 && col < N_COLS) {
			slice.push(new Point(row, col));
			desc_lookup[row + col * N_ROWS] = slice;
			row--;
			col++;
		}
	}
	// get all the ones that hit the top. don't double count the one overlap.
	for (let start_col = 1; start_col < N_COLS; start_col++) {
		let slice = [];
		let row = N_ROWS-1;
		let col = start_col;
		while (row >= 0 && col < N_COLS) {
			slice.push(new Point(row, col));
			desc_lookup[row + col * N_ROWS] = slice;
			row--;
			col++;
		}
	}

	// package up the results for each square
	for (let idx = 0; idx < N_ROWS * N_COLS; idx++) {
		slice_lookup[idx] = [
			row_lookup[idx],
			col_lookup[idx],
			asc_lookup[idx],
			desc_lookup[idx]
		];
	}
}
init_slices();

function is_filled(board) {
	for (let idx = N_ROWS-1; idx < board.length; idx += N_ROWS) {
		if (!board[idx]) {
			return false;
		}
	}
	return true;
}
function first_open_row(col, board) {
	for (let row = 0; row < N_ROWS; row++) {
		if (!board[row + col * N_ROWS]) {
			return row;
		}
	}
	return null; // column is filled
}

const RESULT = {
	CONTINUE : 0,
	YELLOW_WINS : 1,
	RED_WINS : 2,
	DRAW : 3
};

// TODO collapse to one function
function check_result(row, col, board) {
	return check_result_with_squares(row, col, board).result;
}
// in the case of a win, also includes the winning squares
function check_result_with_squares(row, col, board) {
	const slices = slice_lookup[row + col*N_ROWS];

	for (let s=0; s<slices.length; s++) {
		let slice = slices[s];

		for (let i = 0; i < slice.length - 3; i++) {
			let sum = 
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
		result: is_filled(board) ? RESULT.DRAW : RESULT.CONTINUE,
		squares: null
	};
}

function board_to_string(board) {
	let string = "\n";
	for (let row = N_ROWS-1; row >= 0; row--) {
		for (let col = 0; col < N_COLS; col++) {
			let val = board[row + col * N_ROWS];
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
