DEBUG = true;

window.onload = function () {
  const input = document.getElementById("regex");
  const parseButton = document.getElementById("parseBtn");
  const otherLink = document.querySelector(".other-link");

  const isToDFA = location.pathname.includes("dfa");
  const search = new URLSearchParams(location.search);
  const r = search.get("r");
  if (r != null) {
    input.value = r;
    otherLink.href = otherLink.href + "?" + search.toString();
    kickoff(r);
  }

  parseButton.addEventListener("click", () => {
    search.set("r", input.value);
    location.search = search.toString();
  });

  function kickoff(regex) {
    const [nodes, transitions, _start, other] = isToDFA
      ? convertRegexToDFA(regex)
      : convertRegexToNFA(regex);

    const g = new dagreD3.graphlib.Graph()
      .setGraph({ rankdir: "LR" })
      .setDefaultEdgeLabel(() => {});

    nodes.forEach((node) => {
      g.setNode(node.id, {
        label: node.label,
        shape: node._isFinal ? "dblcircle" : "circle",
      });
    });

    transitions.forEach(({ from, to, input }) => {
      g.setEdge(from, to, { label: input, curve: d3.curveBasis });
    });

    const render = new dagreD3.render();

    render.shapes().dblcircle = (parent, bbox, node) => {
      const r = Math.min(bbox.width / 2, bbox.height / 2);
      const circle = {
        x: bbox.width / 2,
        y: bbox.height / 2,
        r,
      };

      parent
        .insert("circle", ":first-child")
        .attr("x", circle.x)
        .attr("y", circle.y)
        .attr("r", circle.r * .8);

      const shapeSvg = parent
        .insert("circle", ":first-child")
        .attr("x", circle.x)
        .attr("y", circle.y)
        .attr("r", circle.r);

    
      // .attr("transform", "translate(" + (-w/2) + "," + (h * 3/4) + ")");

      node.intersect = function (point) {
        return dagreD3.intersect.circle(node, r, point);
      };

      return shapeSvg;
    };

    const board = d3.select("#board");
    const { width, height } = board.node().getBoundingClientRect();

    board.html("");

    // Set up an SVG group so that we can translate the final graph.
    const svg = board.append("svg");
    svg.attr("width", width);
    svg.attr("height", height);

    const svgGroup = svg.append("g"),
      zoom = d3.zoom().on("zoom", () => {
        svgGroup.attr("transform", d3.event.transform);
      });
    svg.call(zoom);

    // Run the renderer. This is what draws the final graph.
    render(svgGroup, g);

    // Center the graph
    const initialScale = 0.75;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(
          (svg.attr("width") - g.graph().width * initialScale) / 2,
          (svg.attr("height") - g.graph().height * initialScale) / 2
        )
        .scale(initialScale)
    );

    isToDFA && showReport(nodes, other);
  }
};

function showReport(dfaStates, { dfaStateReports }) {
  const statesMap = {};
  dfaStates.forEach((s) => {
    statesMap[s.label] = s;
  });

  const reportHTML = Object.keys(dfaStateReports)
    .sort()
    .reduce((Dtrans, stateLabel) => {
      Dtrans += `<h4 class="dtrans-header"><em>${stateLabel}</em> = { ${statesMap[stateLabel].states} }</h4>`;

      Dtrans += "<div class='dtrans-body'>";

      Dtrans += Object.keys(dfaStateReports[stateLabel])
        .sort()
        .reduce((d, symbol) => {
          const { move, closure } = dfaStateReports[stateLabel][symbol];

          d += `<div class="dtrans-block">
  <h5>DFA transition on <em>${symbol}</em></h5>
  <p>Move(${stateLabel}, ${symbol}) = { ${move} }</p>
  <p>${EPSILON}-closure[Move(${stateLabel}, ${symbol})] = { ${closure} }</p>
</div>`;

          return d;
        }, "");

      Dtrans += "</div>";

      return Dtrans;
    }, "");

  d3.select("#report").html(reportHTML);
}
