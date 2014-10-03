#!/bin/bash


mkdir -p css
mkdir -p lib

bower install
scss --compass -I./lib/jackilyn.animate.scss/source sass/_mymenu.scss:css/mymenu.css
uglifyjs js/mymenu.js > js/mymenu.min.js
uglifycss css/mymenu.css > css/mymenu.min.css

