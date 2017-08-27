// trade-off between exploration and exploitation
const C = 1.2

// TODO: run MCTS from top level so we don't need to divide by 7 here
// TODO: can sometimes cause a nan somewhere with 10ms total time
function timeout(start, player) {
    const buffer = 5;
    const now = new Date();
    const limit = read_time_limit_ms(player);
    return now - start >= (limit - buffer) / 7;
}

function score(result, player) {
    if (result === RESULT.DRAW) {
        return 0;
    }
    if (result === RESULT.CONTINUE) {
        throw "score is undefined because the game hasn't ended";
    }
    return player === to_winner(result) ? 1 : -1;
}

function Node(parent_node, state, result, square) {
    this.parent_node = parent_node;
    this.state = state;
    this.children = [];
    this.wins = 0;
    this.sims = 0;
    this.result = result;
    this.square = square;

    // if is_max, then this node is trying to maximize over its children 
    this.is_max = !parent_node ? false : !parent_node.is_max

    if (parent_node) {
        parent_node.children.push(this)
    }
}

// TODO: scale these between -1 and 1 more gracefully
// TODO: backprop terminal results differently
function UCT(node, player) {
    if (!node.parent_node) {
        throw "UCT undefined for the root";
    }
    if (node.result !== RESULT.CONTINUE) {
        // we know the exact result
        return score(node.result);
    }

    const mean = node.wins / node.sims;
    const interval = Math.sqrt(Math.log(node.parent_node.sims) / node.sims);

    if (node.parent_node.is_max) {
        return Math.min(0.95, mean + C * interval);
    } else {
        return Math.max(-0.95, mean - C * interval);
    }
}

// select unexplored or best-scoring child
function select(node, player) {
    if (node.sims === 0 || node.result !== RESULT.CONTINUE) { 
        return node;
    }
    for (child of node.children) {
        if (child.sims === 0) {
            return child;
        }
    }
    if (node.children.length === 0) {
        throw "node has no children";
    }
    let best_child = node.children[0];
    let best_score = UCT(best_child, player);

    for (child of node.children) {
        let score = UCT(child, player);
        if ((node.is_max && score > best_score) ||
            (!node.is_max && score < best_score)) {
            best_score = score;
            best_child = child;
        }
    }
    return select(best_child, player);
}

function expand(node) {
    if (node.result !== RESULT.CONTINUE) {
        // the node is terminal, so we can't expand further
        return;
    }

    let options = possible_moves(node.state.board);
    if (options.length === 0) {
        throw "no legal moves in expand()";
    }

    for (option of options) {
        let state = node.state.clone();
        let result = state.move(option);
        let child = new Node(node, state, result, option);
    }
}

// play the reflex agent against itself to the end once 
function rollout(node, player) {
    const state = node.state.clone()

    let result = node.result;

    while (result === RESULT.CONTINUE) {
        let move = choose_move_with_eval(reflex, state);
        result = state.move(move);
    }
    return score(result, player);
}

// record the result from the leaf up to the root
function backprop(leaf, score) {
    let node = leaf;
    node.sims++;
    node.wins += score;

    while (node.parent_node != null) {
        node = node.parent_node;
        node.sims++;
        node.wins += score;
    }
}

function mcts(square, player, orig_state) {
    const start = new Date();
    const state = orig_state.clone()
    const result = state.move(square);
    if (result !== RESULT.CONTINUE) {
        return score(result, player);
    }
    const root = new Node(null, state, RESULT.CONTINUE, square);

    while (!timeout(start, player)) {
        let node = select(root);

        expand(node);

        let rollout_score = rollout(node, player);

        backprop(node, rollout_score);
    }
    let val = root.wins / root.sims;
    console.log(square + " -> " + val + "(" + root.sims + " rollouts)");
    return val;
}
