const EVAL_FUNCTION = mcts;
const MONTE_CARLO_TRIALS = 20;
const SEARCH_DEPTH = 3;

// single entry point to this file
function choose_move(player, board) {
	console.log("new turn");
	return choose_move_with_eval(EVAL_FUNCTION, initialState(player, board));
}

function choose_move_with_eval(eval_function, state) {
	let options = possible_moves(state.board);

	let vals = [];
	for (let i = 0; i<options.length; i++) {
		vals[i] = eval_function(options[i], state.player, state);
	}

	let max = vals[0];
	for (let i=1; i < vals.length; i++) {
		max = Math.max(max, vals[i]);
	}
	for (let i=0; i < vals.length; i++) {
		if (vals[i] === max) {
			return options[i];
		}
	}
	throw "oops " + vals;
}

function possible_moves(board) {
	let options = [];
	for (let col=0; col<N_COLS; col++) {
		let row = first_open_row(col, board);
		if (row !== null) {
			options.push(new Point(row, col));
		}
	}
	if (options.length === 0) { 
		throw "board unexpectedly filled"; 
	}
	return options;
}

// simple reflex agent with rules:
// (1) win, if you can
// (2) block 4-in-a-row, if you can
// (3) don't play if your opponent has a threat above you
// (4) don't play if you have a threat above you
// (5) choose randomly
function reflex(square, player, state) {
	const threat_here = state.threats[square.row + square.col * N_ROWS];
	const threat_above = (square.row+1 < N_ROWS) ? 
		state.threats[square.row + 1 + square.col * N_ROWS] : 0;

	let val = fastRand();
	if (threat_here === player) {val += 10000; }
	if (threat_here === other(player)) {val += 1000; }
	if (threat_above === other(player)) {val -= 100; }
	if (threat_above === player) {val -= 10; }
	return val;
}

// play reflex agent against itself a bunch of times
function monte_carlo(square, orig_player, old_state) {
	let score = 0;
	for (let trial = 0; trial < MONTE_CARLO_TRIALS; trial++) {
		let state = old_state.clone();
		let result = state.move(square);

		let first_turn = true;
		while (result === RESULT.CONTINUE) {
			first_turn = false;

			let move = choose_move_with_eval(reflex, state);

			result = state.move(move);
		}
		let winner = to_winner(result);
		if (winner === orig_player) {
			score += first_turn ? 10 : 1;
		} else if (winner === other(orig_player)) {
			score -= first_turn ? 10 : 1;
		}	
	}
	return score / MONTE_CARLO_TRIALS;
}

function minimax_rec(square, depth, orig_player, old_state) {
	const state = old_state.clone();
	const result = state.move(square);

	if (result === RESULT.DRAW) {
		return 0;
	} 
	if (result !== RESULT.CONTINUE) {
		return orig_player === to_winner(result) ? 10 : -10;
	}

	const options = possible_moves(state.board);
	let max = -Infinity;
	let min = +Infinity;
	for (let i = 0; i < options.length; i++) {
		let val = depth === SEARCH_DEPTH ?
			monte_carlo(options[i], orig_player, state) :
			minimax_rec(options[i], depth+1, orig_player, state);
		max = Math.max(max, val);
		min = Math.min(min, val);
	}
	return state.player === orig_player ? max : min;
}

function minimax(square, player, state) {
	let val = minimax_rec(square, 1, player, state);
	console.log(square + " -> " + val);
	return val;
}

function to_winner(result) {
	return result === RESULT.YELLOW_WINS ? YELLOW :
		result === RESULT.RED_WINS ? RED : 0;
}

