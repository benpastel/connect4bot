const global_threats = new Uint8Array(N_ROWS * N_COLS);
const last_updated = new Uint8Array(N_ROWS * N_COLS);

const EVAL_FUNCTION = minimax;
const MONTE_CARLO_TRIALS = 500;
const SEARCH_DEPTH = 6;

function choose_move(player, board) {
	console.log("new turn!");
	return choose_move_with_eval(player, board, EVAL_FUNCTION);
}

function choose_move_with_eval(player, board, eval_function) {
	update_threats(board, global_threats);

	var options = possible_moves(board);

	var vals = [];
	for (var i = 0; i<options.length; i++) {
		vals[i] = eval_function(options[i], player, board, global_threats);
	}

	var max = vals[0];
	for (var i=1; i < vals.length; i++) {
		max = Math.max(max, vals[i]);
	}
	for (var i=0; i < vals.length; i++) {
		if (vals[i] === max) {
			return options[i];
		}
	}
	throw "oops " + vals;
}

function unfilled_row(col, board) {
	for (var row = 0; row < N_ROWS; row++) {
		if (!board[row + col * N_ROWS]) {
			return row;
		}
	}
	return null;
}
function possible_moves(board) {
	var options = [];
	for (var col=0; col<N_COLS; col++) {
		var row = unfilled_row(col, board);
		if (row !== null) {
			options.push(new Point(row, col));
		}
	}
	if (options.length === 0) { 
		throw "board unexpectedly filled"; 
	}
	return options;
}

function update_threats(board, threats) {
	// a threat means 4 consecutive squares with 
	// 3 of one color + 1 empty square 
	//
	// heavily inlined after profiling

	// scan for new moves
	for (var i = 0; i < board.length; i++) {
		if (board[i] && !last_updated[i]) {
			// found a new move
			last_updated[i] = true;

			var slices = slice_lookup[i];
			for (var s = 0; s < slices.length; s++) {
				var slice = slices[s];
				for (var i=0; i<slice.length-3; i++) {
					var sum = 
						board[slice[i].row + slice[i].col * N_ROWS] + 
						board[slice[i+1].row + slice[i+1].col * N_ROWS] + 
						board[slice[i+2].row + slice[i+2].col * N_ROWS] + 
						board[slice[i+3].row + slice[i+3].col * N_ROWS];

					if (sum === 3 || sum === 30) {
						var open_square =
							!board[slice[i].row + slice[i].col * N_ROWS] ? slice[i] :
							!board[slice[i+1].row + slice[i+1].col * N_ROWS] ? slice[i+1] :
							!board[slice[i+2].row + slice[i+2].col * N_ROWS] ? slice[i+2] :
							slice[i+3] ;
						threats[open_square.row + open_square.col * N_ROWS] =
							sum === 3 ? YELLOW : RED; 
					}
				}
			}
		}
	}
}

var FAST_RAND = Math.floor(Math.random() * 65537);
// fast, somewhat random number in [0, 10)
// en.wikipedia.org/wiki/Lehmer_random_number_generator
function fastRand() {
	FAST_RAND = (75 * FAST_RAND) % 65537;
	return FAST_RAND % 10;
}

// simple reflex agent with rules:
// (1) win, if you can
// (2) block 4-in-a-row, if you can
// (3) don't play if your opponent has a threat above you
// (4) don't play if you have a threat above you
// (5) choose randomly
function reflex(square, player, board, threats) {
	const threat_here = threats[square.row + square.col * N_ROWS];
	const threat_above = (square.row+1 < N_ROWS) ? 
		threats[square.row + 1 + square.col * N_ROWS] : 0;

	var val = fastRand();
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

		board[square.row + square.col * N_ROWS] = orig_player;
		var result = check_result(square.row, square.col, board).result;

		while (result === RESULT.CONTINUE) {
			var move = choose_move_with_eval(player, board, reflex);

			board[move.row + move.col * N_ROWS] = player;

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
	return score;
}


function minimax_rec(square, player, orig_player, orig_board, depth) {
	// simulate the move
	// TODO: this is shared with monte carlo above
	const board = clone(orig_board);
	board[square.row + square.col * N_ROWS] = player;
	player = other(player);

	const result = check_result(square.row, square.col, board).result;
	if (result === RESULT.DRAW) {
		return 0;
	} 
	if (result !== RESULT.CONTINUE) {
		const winner = (
			result === RESULT.YELLOW_WINS ? YELLOW :
			result === RESULT.RED_WINS ? RED : 0);
		return orig_player === winner ? 1 : -1;
	}

	if (depth === SEARCH_DEPTH) {
		return 0;
	}

	const options = possible_moves(board);
	var vals = []
	for (var i = 0; i < options.length; i++) {
		var val = minimax_rec(options[i], player, orig_player, board, depth+1);
		vals.push(val);
	}

	// TODO figure out this weirdness
	var to_return = 
		player === orig_player ? 
		Math.max.apply(null, vals) : 
		Math.min.apply(null, vals) ;

	return to_return;
}

function minimax(square, player, board, threats) {
	var val = minimax_rec(square, player, player, board, 1);
	console.log(square + " -> " + val);
	return val;
}



// const N_TRIALS = 100;
// function time() {
// 	console.log("timing " + N_TRIALS);
// 	var sum = 0;
// 	for (var t=0; t<N_TRIALS; t++) {
// 		var start = new Date().getTime();
// 		choose_move(YELLOW, global_board);
// 		var stop = new Date().getTime();
// 		console.log("elapsed: " + (stop - start));
// 		sum += (stop - start);
// 	}
// 	console.log("average: " + sum / N_TRIALS);
// }
// time();



