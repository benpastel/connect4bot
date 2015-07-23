function unfilled_row(col, board) {
	for (var row = 0; row < N_ROWS; row++) {
		if (get(row, col, board) === 0) {
			return row;
		}
	}
	return N_ROWS;
}

function choose_move(player, board) {
	// return reflex_move(player, board);
	return left_move(player, board);
}

// simple reflex agent with rules:
// (1) win, if you can
// (2) block 4-in-a-row, if you can
// (3) don't play if your opponent has a threat above you
// (4) don't play if you have a threat above you
// (5) choose randomly
// const threats = new Uint8Array(N_ROWS * N_COLS);
// var last_updated = new Uint8Array(N_ROWS * N_COLS);
// function reflex_move(player, board) {
// 	// scan for new moves since we last checked
// 	var new_rows = []
// 	var new_cols = []
// 	for (var col = 0; col < N_COLS; col++) {
// 		for (var row = 0; row < N_ROWS; row++) {
// 			if (get(row, col, last_updated) !== get(row, col, board)) {
// 				new_rows.push(row);
// 				new_cols.push(col);
// 			}
// 		}
// 	}
// 	// check for threats on those slices
// 	for (int i = 0)

// }

// take the leftmost available move
function left_move(player, board) {
	for (var col = 0; col < N_COLS; col++) {
		var row = unfilled_row(col, board);
		if (row < N_ROWS) {
			return {
				row: row,
				col: col
			};
		}
	}
	throw "board is unexpectedly full!";
}

