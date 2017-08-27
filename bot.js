const global_threats = new Uint8Array(N_ROWS * N_COLS);
const global_threats_updated = new Uint8Array(N_ROWS * N_COLS);

const EVAL_FUNCTION = mcts;
const MONTE_CARLO_TRIALS = 20;
const SEARCH_DEPTH = 3;

// single entry point to this file
function choose_move(player, board) {
	console.log("new turn");
	return choose_move_with_eval(EVAL_FUNCTION,
		new State(player, board, global_threats, global_threats_updated));
}

function reset_bot_state() {
	for (let i=0; i<N_ROWS * N_COLS; i++) {
		global_threats[i] = 0;
		global_threats_updated[i] = false;
	}
}

function choose_move_with_eval(eval_function, state) {
	// TODO: do I still need to update threats here?
	update_threats(state.board, state.threats, state.updated);

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

function unfilled_row(col, board) {
	for (let row = 0; row < N_ROWS; row++) {
		if (!board[row + col * N_ROWS]) {
			return row;
		}
	}
	return null;
}

function possible_moves(board) {
	let options = [];
	for (let col=0; col<N_COLS; col++) {
		let row = unfilled_row(col, board);
		if (row !== null) {
			options.push(new Point(row, col));
		}
	}
	if (options.length === 0) { 
		throw "board unexpectedly filled"; 
	}
	return options;
}

function update_threats(board, threats, updated) {
	// a threat means 4 consecutive squares with 
	// 3 of one color + 1 empty square 
	//
	// heavily inlined after profiling

	// scan for new moves
	for (let i = 0; i < board.length; i++) {
		if (board[i] && !updated[i]) {
			// found a new move
			updated[i] = true;

			let slices = slice_lookup[i];
			for (let s = 0; s < slices.length; s++) {
				let slice = slices[s];
				for (let i=0; i<slice.length-3; i++) {
					let sum = 
						board[slice[i].row + slice[i].col * N_ROWS] + 
						board[slice[i+1].row + slice[i+1].col * N_ROWS] + 
						board[slice[i+2].row + slice[i+2].col * N_ROWS] + 
						board[slice[i+3].row + slice[i+3].col * N_ROWS];

					if (sum === 3 || sum === 30) {
						let open_square =
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

// fast, somewhat random number in [0, 10)
// en.wikipedia.org/wiki/Lehmer_random_number_generator
let FAST_RAND = Math.floor(Math.random() * 65537);
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

// player means the player whose turn it is
function State(player, board, threats, updated) {
	this.player = player;
	this.board = board;
	this.threats = threats;
	this.updated = updated;
}

State.prototype.clone = function() {
	return new State(
		this.player,
		clone_array(this.board),
		clone_array(this.threats),
		clone_array(this.updated));
}

State.prototype.move = function(square) {
	this.board[square.row + square.col * N_ROWS] = this.player;

	this.player = other(this.player);

	update_threats(this.board, this.threats, this.updated);

	return check_result(square.row, square.col, this.board);
}

function clone_array(a) {
	const b = new Uint8Array(a.length);
	for (let i=0; i<a.length; i++) {
		b[i] = a[i];
	}
	return b;
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

