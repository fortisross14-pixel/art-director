#!/bin/bash
# Balance sweep: one line per career for every district archetype.
# usage: npm run sim:sweep -- [weeks=1820] [runs=2]
cd "$(dirname "$0")/.."
W=${1:-1820}; N=${2:-2}
run() { npx tsx scripts/balance.ts $W $N $1 $2 $3 2>&1 | grep -A1 "^run" | grep -v "^--" | paste - - | sed "s/^/$1-$2: /; s/house2[^·]*· //; s/firstRare[^·]*· //; s/worldTop10[^·]*· //; s/, best.*//; s/  */ /g"; }
run historic heir renaissance &
run art collector baroque &
run college academic classical &
run bohemian artist contemporary &
run downtown entrepreneur popculture &
run park heir impressionism &
run waterfront collector egyptian &
wait
