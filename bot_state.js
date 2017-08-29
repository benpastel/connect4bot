function init_threats(board) {
    const threats = new Uint8Array(N_ROWS * N_COLS);
    for (let i = 0; i < board.length; i++) { 
        if (board[i]) {
            update_threats(board, threats, i);
        }
    }
    return threats;
}

// a threat means 4 consecutive squares with 
// 3 of one color + 1 empty square 
//
// some loops manually unrolled after profiling
function update_threats(board, threats, square) {
    const slices = slice_lookup[square];
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

function initialState(player, board) {
    return new State(player, board, init_threats(board));
}

function State(player, board, threats) {
    this.player = player;
    this.board = board;
    this.threats = threats;
}

State.prototype.clone = function() {
    return new State(
        this.player,
        clone_array(this.board),
        clone_array(this.threats));
}

State.prototype.move = function(square) {
    const idx = square.row + square.col * N_ROWS;
    this.board[idx] = this.player;
    this.player = other(this.player);
    update_threats(this.board, this.threats, idx);
    return check_result(square.row, square.col, this.board);
}
