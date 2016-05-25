Eye diagram visualization using D3.js
=====================================

*Note: This is "under-development" (to the extent I have time). While usable, the experience might not be very smooth with regard to configuration, documentation, etc.*

Eye diagram visualization using the [D3.js](http://d3js.org) javascript library.

See http://www.tmpl.fi/D3js_eye_diagram/ for an example diagram.

See [Probabilistic retrieval and visualization of biologically relevant microarray experiments](http://bioinformatics.oxfordjournals.org/content/25/12/i145.full) by Caldas et al. for the original visualization technique. Their code is available at https://github.com/ouzor/eyediagram.

See `eye_diagram_data.R` for an example how to generate eye diagram datafile from [CCAGFA](https://cran.r-project.org/web/packages/CCAGFA/index.html) objects.


Usage on a web page
-------------------

(1) In the head of the html page, include [D3.js](http://d3js.org), the diagram code (which exports a single javascript function `draw_diagram`), and some css (here `#dg` is the id of the svg element of the visualization).

~~~~~ html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
<script src="eye_diagram_browser.js" charset="utf-8"></script>
<style>
#dg {
  background-color: #fff;
  font-size: 4px;
}
#dg .line {
  fill: none;
}
#dg .nodes {
  stroke: #000;
  stroke-width: 0.5;
}
</style>
~~~~~ 

(2) In the body of the html page, include the svg element, set some options, load data (here, from `data.json`; see below), and draw the diagram.

~~~~~ html
<svg id="dg"></svg>

<script type="text/javascript">
// options, see the opts structure below for details
var height = 600;
var width = 700;
var tension = 1;
var ctrl_point_offset_coeff = 0.3;
var Z_y_margin_coeff = 0.25;
var radius = 400;
var nodesize = 3;
var Z_labels_dy = 8;
var Z_labels_dx = 0;
var Y_labels_dy = 2;
var Y_labels_dx = 5;
var Y_left_angle = 3.1415 / 2;
var Y_right_angle = 3.1415 / 2;

var opts = { height: height,
             width: width,
             // parameter of edge behaviour (d3 "bundle" spline parameter)
             tension: tension,
             // parameter of edge behaviour (determines where spline control
             // points lie between the connected nodes)
             ctrl_point_offset_coeff: ctrl_point_offset_coeff,
             // Z are the nodes in the middle of the diagram positioned on a
             // vertical line
             Z: {
               // nodes will lie in a vertical line between y0 and y1 at equal
               // spacing
               y0: Z_y_margin_coeff * height,
               y1: (1 - Z_y_margin_coeff) * height,
               // x position of the nodes
               x: width / 2,
               nodesize: nodesize,
               draw_labels: true,
               // label text horizontal offset
               labels_dx: Z_labels_dx,
               // label text vertical offset
               labels_dy: Z_labels_dy,
               // label text anchor
               labels_anchor: "middle"
             },
             // Y_left and Y_right are side nodes positioned along a part of
             //  the perimeter of a circle according to the options
             Y_left: {
               // how large part of the perimeter of the cirle is used
               // (angle_at_node runs from -angle/2 to angle/2 with equal
               // spacing)
               angle: Y_left_angle,
               // vertical radius of the cirle
               y_radius: radius,
               // vertical center of the circle
               // [node_y_pos = y_offset + y_radius * sin(angle_at_node)]
               y_offset: height / 2,
               // horizontal radius of the circle (negative for left size nodes)
               x_radius: -radius,
               // horizontal center of the cirle
               // [node_x_pos = x_offset + x_radius * cos(angle_at_node)]
               x_offset: radius + 0.05 * width,
               // 1 for left side nodes, -1 for right side (if 
               // x_radius != y_radius, edges will not be exactly normal to the
               // tangent of the circle)
               tan_dir: 1,
               nodesize: nodesize,
               draw_labels: true,
               labels_dx: -Y_labels_dx,
               labels_dy: Y_labels_dy,
               labels_anchor: "end"
             },
             Y_right: {
               angle: Y_right_angle,
               y_radius: radius,
               y_offset: height / 2,
               x_radius: radius,
               x_offset: 0.95 * width - radius,
               tan_dir: -1,
               nodesize: nodesize,
               draw_labels: true,
               labels_dx: Y_labels_dx,
               labels_dy: Y_labels_dy,
               labels_anchor: "start"
             }
           };

// load data and draw
d3.json("data.json", function(error, json) {
  if (error) return console.warn(error);
  draw_diagram("#dg", json.Y_left, json.Y_right, json.Z, json.Y_left_to_Z, json.Y_right_to_Z, opts);
});
</script>
~~~~~ 

Data format
-----------

The `draw_diagram`-function takes 5 parameters describing the nodes and edges of the diagram (in addition to the id and options).

The first three (`json.Y_left`, `json.Y_right`, `json.Z` above) describe the nodes of the diagram (in the order left, right, middle). They should be javascript arrays with elements of form `{ "label": "Y1", "c": "#000000" }`, where `"label"` gives the label text and `"c"` gives the fill color of the node.

The latter two (`json.Y_left_to_Z` and `json.Y_right_to_Z` above) describe the edges of the diagram (from the left and right nodes to the middle nodes). They should be javascript arrays with elements of form `{"Y": 0, "Z": 0, "w": 1, "o": 0.6, "c": "#990000" }`, where `"Y"` gives the index of the side node in the corresponding node array, `"Z"` the index of the middle node, `"w"` the width of the edge, `"o"` the opacity, and `"c"` the color.

See `data.json` for an example file.

See `eye_diagram_data.R` for an example of generating the json-file in [R](https://www.r-project.org) code.


Rendering to svg-file
---------------------

Rendering directly to an svg-file is useful, for example, for post-processing (adding further annotations etc.) or saving to pdf using CairoSVG (see below) or [Inkscape](https://inkscape.org).

To export the svg diagram (if data filename is omitted, data.json is used by default; if configuration file is omitted, the default configuration in the script is used; currently if given, the configuration file needs to be complete):
~~~~~
node export_eye_diagram.js data.json config.json > test.svg
~~~~~

This requires nodejs with d3 and jsdom, which can be installed using npm:
~~~~~
npm install d3
npm install jsdom
~~~~~

One can use python based CairoSVG to convert svg to pdf (see http://stackoverflow.com/questions/14903233/converting-svg-with-embedded-css-to-pdf-in-python). Install it and dependencies via pip:
~~~~~
pip3 install cairosvg lxml tinycss cssselect
~~~~~

Then run:
~~~~~
cairosvg test.svg -o test.pdf
~~~~~


TODO
----

 * Make nicer looking example using real data.
 * Make better automatic configuration tailored according to the data file.
 * Allow specifying partial configuration and use defaults elsewhere.
 * Code is now duplicated between browser and nodejs versions; make them use same core code.
 * Make the R code data generation from CCAGFA objects more flexible (try optimizing variable and component ordering for best visual effect?).


Contact
-------

 * E-mail: tomi.peltola@tmpl.fi
 * WWW: http://www.tmpl.fi
 * GitHub: https://github.com/to-mi/


License
-------

The MIT License. See LICENSE file for the full license text.
