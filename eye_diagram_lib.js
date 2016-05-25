// Eye diagram visualization using D3.js.
// Licensed under The MIT License.
// Author: Tomi Peltola, http://www.tmpl.fi.
var d3 = require("d3");

var get_default_options = function() {
  // Options; see the opts structure below for details
  var height = 600;
  var width = 700;
  var tension = 1;
  var ctrl_point_offset_coeff = 0.3;
  var Z_y_margin_coeff = 0.25;
  var radius = 400;
  var nodesize = 3;
  var Z_labels_dy = 15;
  var Z_labels_dx = 0;
  var Y_labels_dy = 3;
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

  return opts;
};

var draw_diagram = function(elem, Y_left, Y_right, Z, Y_left_to_Z, Y_right_to_Z, opts) {
  var svg = d3.select(elem).append("svg")
              .attr('xmlns', 'http://www.w3.org/2000/svg')
              .attr("width", opts.width)
              .attr("height", opts.height);

  // add css
  var svg_style = svg.append("defs")
                     .append('style')
                     .attr('type','text/css');

  var css_text = "<![CDATA[ \
      svg { \
        background-color: #fff; \
        font-size: 10px; \
      } \
      .line { \
        fill: none; \
      } \
      .nodes { \
        stroke: #000; \
        stroke-width: 0.5; \
      } \
  ]]> ";

  svg_style.text(css_text);

  var line = d3.svg.line()
                    .x(function(d) { return d[0]; })
                    .y(function(d) { return d[1]; })
                    .interpolate("bundle")
                    .tension(opts.tension);

  var positionZ = function(Z, opts) {
    var dy = (opts.y1 - opts.y0) / (Z.length - 1);
    for (var i=0; i < Z.length; i++) {
      Z[i]["x"] = opts.x;
      Z[i]["y"] = opts.y0 + i * dy;
      Z[i]["r"] = opts.nodesize;
    }
  };

  var positionY = function(Y, opts) {
    var dt = opts.angle / (Y.length - 1);
    for (var i=0; i < Y.length; i++) {
      Y[i]["x"] = opts.x_offset + opts.x_radius * Math.cos(-0.5 * opts.angle + i * dt);
      Y[i]["y"] = opts.y_offset + opts.y_radius * Math.sin(-0.5 * opts.angle + i * dt);
      Y[i]["tan"] = opts.tan_dir * Math.tan(-0.5 * opts.angle + i * dt);
      Y[i]["r"] = opts.nodesize;
    }
  };

  var YtoZline = function(Y, Z, opts) {
    return function(d) {
      var p1 = [Y[d["Y"]]["x"], Y[d["Y"]]["y"]];
      var p4 = [Z[d["Z"]]["x"], Z[d["Z"]]["y"]];
      var p3 = [p1[0] + (1 - opts.ctrl_point_offset_coeff) * (p4[0] - p1[0]), p4[1]];
      var dx = opts.ctrl_point_offset_coeff * (p4[0] - p1[0]);
      var p2 = [p1[0] + dx, p1[1] - Y[d["Y"]]["tan"] * dx];
      var dat = [p1, p2, p3, p4];
      return line(dat);
    };
  };

  var draw_edges = function(edges, Y, Z, opts) {
    svg.append("g").selectAll("path")
                   .data(edges)
                   .enter()
                   .append("path")
                   .attr("class", "line")
                   .attr("stroke-width", function (d) { return d["w"]; })
                   .attr("stroke-opacity", function (d) { return d["o"]; })
                   .attr("stroke", function (d) { return d["c"]; })
                   .attr("d", YtoZline(Y, Z, opts));
  };

  var draw_nodes = function(nodes, opts) {
    var n_svg = svg.append("g").selectAll("circle")
                   .data(nodes)
                   .enter();
              n_svg.append("circle")
                   .attr("cx", function (d) { return d["x"]; })
                   .attr("cy", function (d) { return d["y"]; })
                   .attr("r", function (d) { return d["r"]; })
                   .attr("fill", function (d) { return d["c"]; })
                   .attr("class", "nodes");
    if (opts.draw_labels) {
              n_svg.append("text")
                   .attr("x", function (d) { return d["x"]; })
                   .attr("y", function (d) { return d["y"]; })
                   .attr("dx", opts.labels_dx)
                   .attr("dy", opts.labels_dy)
                   .attr("text-anchor", opts.labels_anchor)
                   .text(function (d) { return d["label"]; });
    }
  };

  positionZ(Z, opts.Z);
  positionY(Y_left, opts.Y_left);
  positionY(Y_right, opts.Y_right);
  draw_edges(Y_left_to_Z, Y_left, Z, opts);
  draw_edges(Y_right_to_Z, Y_right, Z, opts);
  draw_nodes(Z, opts.Z);
  draw_nodes(Y_left, opts.Y_left);
  draw_nodes(Y_right, opts.Y_right);
};

exports.get_default_options = get_default_options;
exports.draw_diagram = draw_diagram;

