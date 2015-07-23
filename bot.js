function unfilled_row(col, board) {
	for (var row = 0; row < N_ROWS; row++) {
		if (get(row, col, board) === 0) {
			return row;
		}
	}
	return N_ROWS;
}

function choose_move(player, board) {
	return reflex_move(player, board);
}

// simple reflex agent with rules:
// (1) win, if you can
// (2) block 4-in-a-row, if you can
// (3) don't play if your opponent has a threat above you
// (4) don't play if you have a threat above you
// (5) choose randomly
const threats = new Uint8Array(N_ROWS * N_COLS);
const last_updated = new Uint8Array(N_ROWS * N_COLS);
function reflex_move(player, board) {
	// scan for new moves since we last checked
	var new_moves = []
	for (var col = 0; col < N_COLS; col++) {
		for (var row = 0; row < N_ROWS; row++) {
			var val = get(row, col, board);
			if (get(row, col, last_updated) !== val) {
				new_moves.push(new Point(row, col));
				set(val, row, col, last_updated);
			}
		}
	}
	console.log("looking at " + new_moves.length + " new moves: " + new_moves);
	function mark_threats(slice) {
		// a threat means 4 consecutive squares with 
		// 3 of one color + 1 empty square 
		//
		// relies on YELLOW == 1, RED == 10 for faster checks

		const vals = slice.map(function(square){
			return get(square.row, square.col, board);
		});

		for (var i=0; i<slice.length-3; i++) {
			var sum = vals[i] + vals[i+1] + vals[i+2] + vals[i+3];
			if (sum === 3) {
				var open_square =
					!vals[i] ? slice[i] :
					!vals[i+1] ? slice[i+1] :
					!vals[i+2] ? slice[i+2] :
					slice[i+3] ;
				set(YELLOW, open_square.row, open_square.col, threats);
			}
			else if (sum === 30) {
				var open_square =
					!vals[i] ? slice[i] :
					!vals[i+1] ? slice[i+1] :
					!vals[i+2] ? slice[i+2] :
					slice[i+3] ;
				set(RED, open_square.row, open_square.col, threats);
			}
		}
	}
	for (var i = 0; i < new_moves.length; i++) {
		slices(new_moves[i].row, new_moves[i].col).forEach(mark_threats);
	}
	return left_move(player, board);
}

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

