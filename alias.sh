
alias orun="restart --watch *.js *.template --exec node --harmony server.js --builds ~/code/jobs --nocache true"
alias orun="restart --watch *.js ./lib/*.js ./lib/*.template --exec node --harmony server.js --builds ~/code/jobs --nocache true --env dev --host 192.168.0.3 --protocol https"
alias qgen="./generate.py clean && ./generate.py distclean && ./generate.py && ./generate.py build"

