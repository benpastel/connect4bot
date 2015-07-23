const global_threats = new Uint8Array(N_ROWS * N_COLS);
const last_updated = new Uint8Array(N_ROWS * N_COLS);

const EVAL_FUNCTION = monte_carlo;
const MONTE_CARLO_TRIALS = 100;

function choose_move(player, board) {
	console.log("new turn")
	return choose_move_with_eval(player, board, EVAL_FUNCTION);
}

function choose_move_with_eval(player, board, eval_function) {
	update_threats(board, global_threats);

	var options = [];
	for (var col=0; col<N_COLS; col++) {
		var row = unfilled_row(col, board);
		if (row !== null) {
			options.push(new Point(row, col));
		}
	}
	if (options.length === 0) { throw "board unexpectedly filled"; }

	var vals = [];
	options.forEach(function(square){
		vals.push(eval_function(square, player, board, global_threats));
	})
	var max = vals[0];
	var best_i = 0;
	for (var i=1; i<vals.length; i++) {
		if (vals[i] > max) {
			max = vals[i];
			best_i = i;
		}
	}
	return options[best_i];
}

function unfilled_row(col, board) {
	for (var row = 0; row < N_ROWS; row++) {
		if (get(row, col, board) === 0) {
			return row;
		}
	}
	return null;
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
function reflex(square, player, board, threats) {
	const threat_here = get(square.row, square.col, threats);
	const threat_above = (square.row+1 < N_ROWS) ? 
		get(square.row+1, square.col, threats) : 0;

	var val = Math.floor(Math.random() * 10); // rand < 10
	if (threat_here === player) {val += 10000; }
	if (threat_here === other(player)) {val += 1000; }
	if (threat_above === other(player)) {val -= 100; }
	if (threat_above === player) {val += 10; }

	return val;
}

function clone(a) {
	const b = new Uint8Array(a.length);
	for (var i=0; i<a.length; i++) {
		b[i] = a[i];
	}
	return b;
}

// play reflex agent against itself a bunch of times
function monte_carlo(square, orig_player, orig_board, orig_threats) {

	var score = 0;
	for (var trial = 0; trial < MONTE_CARLO_TRIALS; trial++) {
		var board = clone(orig_board);
		var threats = clone(orig_threats);
		var player = other(orig_player);

		set(orig_player, square.row, square.col, board);
		var result = check_result(square.row, square.col, board).result;

		while (result === RESULT.CONTINUE) {
			var move = choose_move_with_eval(player, board, reflex);

			set(player, move.row, move.col, board);

			var result = check_result(move.row, move.col, board).result;

			player = other(player);

			update_threats(board, threats);
		}
		var winner = (
			result === RESULT.YELLOW_WINS ? YELLOW :
			result === RESULT.RED_WINS ? RED : 0);

		if (orig_player === winner) {
			score += 1;
		} else if (other(orig_player) === winner) {
			score -= 1;
		}	
	}
	console.log("square " + square + " has score " + score);
	return score;
}
