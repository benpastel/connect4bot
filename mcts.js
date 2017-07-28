
// TODO: LEFT OFF HERE: select needs to be recursive
// and it's throwing some undefined node error

// trade-off between exploration and exploitation
const C = Math.sqrt(2)

// number of moves to explore in each square
// TODO: set a time limit instead
const MOVES = 100;

function score(result, player) {
    if (result === RESULT.DRAW) {
        return 0;
    }
    if (result === RESULT.CONTINUE) {
        throw "score is undefined because the game hasn't ended";
    }
    return player === to_winner(result) ? 1 : -1;
}

function Node(parent, state, result) {
    this.parent = parent;
    this.state = state;
    this.children = [];
    this.wins = 0;
    this.sims = 0;
    this.result = result;

    // whether this node min / maxes is the opposite of its parent
    // TODO: look up javascript binding precedence
    this.is_max = (!parent) ? true : (!parent.is_max) 

    if (parent) {
        parent.children.push(this)
    }
}

// TODO: double check that node.is_max is the correct level here
function UCT(node, player) {
    if (!node.parent) {
        throw "UCT undefined for the root";
    }
    if (node.result !== RESULT.CONTINUE) {
        // we know the exact result
        return score(node.result)
    }

    // optimistically estimate the result as score +/- confidence interval
    const mean = node.wins / node.sims
    const interval = Math.sqrt(Math.log(node.parent.sims) / node.sims)
    if (node.is_max) {
        return mean + C * interval
    } else {
        return mean - C * interval
    }
}

// select an unexplored child, or the child with the highest score
// TODO: double check that the min/maxing levels are correct
// TODO: this should be recursive anyway
function select(node, player) {
    if (node.sims === 0) { 
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
    var best_child = node.children[0];
    var best_score = UCT(best_child, player);

    for (child of node.children) {
        var score = UCT(child, player);
        if ((node.is_max && score > best_score) ||
            (node.is_min && score < best_score)) {
            best_score = score;
            best_child = child;
        }
    }
    return best_child;
}

function expand(node) {
    if (node.result !== RESULT.CONTINUE) {
        // the node is terminal, so we can't expand further
        return;
    }

    var options = possible_moves(node.state.board);

    for (option of options) {
        var state = node.state.clone();
        var result = state.move(option);
        var child = Node(node, state, result);
    }
}

// play the reflex agent against itself to the end once 
function rollout(node, player) {
    const state = node.state.clone()

    var result = state.move(square);

    while (result === RESULT.CONTINUE) {
        var move = choose_move_with_eval(reflex, state);
        result = state.move(move);
    }
    return score(result, player);
}

// record the result from the leaf up to the root
function backprop(leaf, score) {
    var node = leaf;
    node.sims++;
    node.wins += score;

    while (node.parent) {
        node = node.parent;
        node.sims++;
        node.wins += score;
    }
}

function mcts(square, player, state) {
    root = Node(null, state, RESULT.CONTINUE);

    for (var m = 0; m < MOVES; m++) {
        node = select(root);
        expand(node);
        score = rollout(node, player);
        backprop(node, score);
    }
    return root.wins / root.sims;

}