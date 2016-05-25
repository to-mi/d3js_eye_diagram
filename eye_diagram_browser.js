// Eye diagram visualization using D3.js.
// Licensed under The MIT License.
// Author: Tomi Peltola, http://www.tmpl.fi.
var draw_diagram = function(id, Y_left, Y_right, Z, Y_left_to_Z, Y_right_to_Z, opts) {
  var svg = d3.select(id)
              .attr("width", opts.width)
              .attr("height", opts.height);

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
