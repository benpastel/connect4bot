const global_threats = new Uint8Array(N_ROWS * N_COLS);
const last_updated = new Uint8Array(N_ROWS * N_COLS);

function unfilled_row(col, board) {
	for (var row = 0; row < N_ROWS; row++) {
		if (get(row, col, board) === 0) {
			return row;
		}
	}
	return null;
}

function choose_move(player, board) {
	return reflex_move(player, board, global_threats);
}

function update_threats(board, threats) {
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
	function mark_threats(slice) {
		// a threat means 4 consecutive squares with 
		// 3 of one color + 1 empty square 

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
}

// simple reflex agent with rules:
// (1) win, if you can
// (2) block 4-in-a-row, if you can
// (3) don't play if your opponent has a threat above you
// (4) don't play if you have a threat above you
// (5) choose randomly
function reflex_move(player, board, threats) {
	update_threats(board, threats);

	var options = [];
	for (var col=0; col<N_COLS; col++) {
		var row = unfilled_row(col, board);
		if (row !== null) {
			options.push(new Point(row, col));
		}
	}
	if (options.length === 0) { throw "board unexpectedly filled"; }

	function eval(square) {
		const threat_here = get(square.row, square.col, threats);
		const threat_above = (square.row+1 < N_ROWS) ? 
			get(square.row+1, square.col, threats) : 0;
		
		var val = Math.floor(Math.random() * 10); // rand < 10
		if (threat_here === player) {val += 10000; }
		if (threat_here === other_player()) {val += 1000; }
		if (threat_above === other_player()) {val += 100; }
		if (threat_above === player) {val += 10; }
		return val;
	}

	const vals = options.map(eval);
	var max = -1;
	var best_i = -1;
	for (var i=0; i<vals.length; i++) {
		if (vals[i] > max) {
			max = vals[i];
			best_i = i;
		}
	}
	return options[best_i];
}

// play reflex agent against itself a bunch of times
// function monte_carlo_move(player, board) {
// }
