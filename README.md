# connect4bot
A bot for Connect 4; also, my first adventures in web programming!

## Bot
I run [Monte Carlo Tree Search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search), which is a pretty cool algorithm if you've never seen it!  It elegantly combines three ideas:

* [Minimax](https://en.wikipedia.org/wiki/Minimax), which exhaustively explores all possibilities as many moves ahead as it can, and then uses a heuristic to estimate how good the result is.

* [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method), which randomly plays the game to the end many times and counts how many times it wins.

* [Multi-Armed Bandits](https://en.wikipedia.org/wiki/Multi-armed_bandit), which chooses among different options by finding confidence bounds on how good they are and optimistically exploring the one with the highest upper confidence bound.  

At each step, the algorithm chooses a branch of the game tree to explore by building confidence intervals, optimistically choosing the most promising one for each of its moves, and pessimistically choosing the least promising one for each of its opponents moves.  Then it runs a random playout to the end of the game and records the winner.  Finally, it tightens the confidence interval on the branch that it explored and propagates that information back up the game tree.

My bot uses a modification on the standard algorithm; instead of _randoming_ playing the game to the end, it follows a few simple rules like always winning when it can, and never playing directly beneath an opponent's threat so that the opponent wins the next turn.  In Connect 4, my idea is that these "heavy" playouts more accurately evaluate the important case where the whole board fills up and then someone wins in the endgame.

The challenge with heavy playouts is that choosing moves intelligently is many orders of magnitude slower than choosing moves randomly, so you end up exploring much less of the game tree.  In this case, the slow part is checking whether there are any new threats on the board since the last move, so I optimized this by precomputing all the potential threats I need to check after each move.

The difficulty sliders adjust how long the bot is allowed to think.

## Web Programming
For learning purposes, everything is in raw javascript and html, except I used [Raphael JS](http://dmitrybaranovskiy.github.io/raphael/) to draw the lines and circles.