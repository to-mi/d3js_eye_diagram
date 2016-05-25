# Eye diagram visualization using D3.js.
# Licensed under The MIT License.
# Author: Tomi Peltola, http://www.tmpl.fi, h.

library(RColorBrewer)

# Example usage: generates data for eye diagram visualization from a CCAGFA run.
# See README.md for how to make the actual visualizaation.
eye_diagram_CCAGFA_example <- function() {
  library(CCAGFA)

  # Generate two views of data.
  set.seed(1234)
  n <- 100
  d1 <- 15; d2 <- 15
  k1 <- 3; k2 <- 3; k_shared <- 3; k <- k1 + k2 + k_shared
  k1s <- k1 + k_shared; k2s <- k2 + k_shared
  k1s_inds <- c(1:k1, (k1+k2+1):k); k2s_inds <- c((k1+1):(k1+k2), (k1+k2+1):k)
  z <- matrix(rnorm(n * k), n, k)

  w1 <- matrix(rgamma(d1 * k1s, 1, 2) * rnorm(d1 * k1s, 2), d1, k1s)
  w2 <- matrix(rgamma(d2 * k2s, 1, 2) * rnorm(d2 * k2s, 2), d2, k2s)

  y1 <- z[,k1s_inds] %*% t(w1) + 0.2 * matrix(rnorm(n * d1), n, d1)
  y2 <- z[,k2s_inds] %*% t(w2) + 0.2 * matrix(rnorm(n * d2), n, d2)

  # Column names will be used in the visualization.
  colnames(y1) <- sprintf('A%d', 1:d1)
  colnames(y2) <- sprintf('B%d', 1:d2)

  # Run GFA.
  fit <- GFA(list(y1, y2), k, getDefaultOpts())

  # Output eye diagram data to data.json. First view will be placed on left side and second on the right side.
  # Note: the generated json will also be returned from this function.
  eye_diagram_data(fit, 0.2, c(1), c(2), 'data.json')
}


# Makes eye diagram json datafile from a CCAGFA fit object:
# fit: CCAGFA object.
# threshold: prunes edges with smaller (absolute) weight than the set threshold.
# g1, g2: indices of variable groups to place on left and right of the diagram.
# filename: output to file.
eye_diagram_data <- function(fit, threshold, g1, g2, file=NULL) {
  vargroups <- lapply(fit$W, rownames)
  k <- fit$K
  nv <- length(vargroups)
  n <- length(unlist(vargroups))

  # collect all views into single W but retain group information
  W <- matrix(0, ncol=n, nrow=k)
  groups <- rep(0, n)
  j <- 1
  for (i in 1:nv) {
    d <- dim(fit$W[[i]])[1]
    W[,j:(j+d-1)] <- t(fit$W[[i]])
    groups[j:(j+d-1)] <- i
    j <- j + d
  }

  # prune latent space
  inds <- apply(abs(W) >= threshold, 1, any)
  W <- W[inds,]
  k <- dim(W)[1]

  # helper functions for edge opacity and color
  maxw <- max(abs(W))
  opa <- function(w) {
    (abs(w)-threshold)/(maxw-threshold)*0.8+0.2
  }
  colo <- function(w) {
    if (w > 0) "#000099"
    else "#990000"
  }

  # do side nodes and edges
  cmap <- brewer.pal(12,"Set3")
  varnames <- unlist(vargroups)

  edges <- list(c(), c())
  Ys <- list(c(), c())

  ii <- c(1, 1)
  for (i in 1:dim(W)[2]) {
    gi <- which(c(any(groups[i] == g1), any(groups[i] == g2)))[1]
    gii <- which(groups[i] == list(g1,g2)[[gi]])

    for (j in 1:k) {
      if (abs(W[j, i]) > threshold) {
        edges[[gi]] <- c(edges[[gi]], sprintf('{"Y": %d, "Z": %d, "w": 1, "o": %.2f, "c": "%s"}', ii[gi]-1, j-1, opa(W[j, i]), colo(W[j, i])))
      }
    }

    Ys[[gi]] <- c(Ys[[gi]], sprintf('{"label": "%s", "c": "%s"}', varnames[i], cmap[((gii-1) %% 12)+1]))

    ii[gi] <- ii[gi] + 1
  }

  # do middle nodes
  varnames <- paste("Z", 1:k, sep="")

  Z <- c()

  for (i in 1:length(varnames)) {
    Z <- c(Z, sprintf('{"label": "%s", "c": "%s"}', varnames[i], "#ffffff"))
  }

  # write json to a string and then file
  out <- sprintf('{ "Z": [%s],\n  "Y_left": [%s],\n  "Y_right": [%s],\n  "Y_left_to_Z": [%s],\n  "Y_right_to_Z": [%s] }\n', paste(Z,collapse=','), paste(Ys[[1]],collapse=','), paste(Ys[[2]],collapse=','), paste(edges[[1]],collapse=','),paste(edges[[2]],collapse=','))

  if (!is.null(file)) writeLines(c(out), file)

  out
}
