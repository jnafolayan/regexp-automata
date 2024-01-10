window.onload = function() {
  const input = document.getElementById("regex");
  const parseButton = document.getElementById("parseBtn");

  parseButton.addEventListener("click", (e) => {
    const start = convertRegexToNFA(input.value);

    const g = new dagreD3.graphlib.Graph()
    .setGraph({ rankdir: 'LR' })
    .setDefaultEdgeLabel(() => {});

    const nodes = getNodes(start);

    nodes.forEach(node => {
      g.setNode(node.id, {
        label: node.label,
        shape: "circle"
      });
    });

    nodes.forEach(node => {
      node.transitions.forEach(({ end, input }) => {
        g.setEdge(node.id, end.id, { label: input, curve: d3.curveBasis });
      });
    });

    const render = new dagreD3.render();

    const board = d3.select("#board");
    board.html("");

    const { width, height } = board.node().getBoundingClientRect();

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
          (svg.attr("height") - g.graph().height * initialScale) / 2)
        .scale(initialScale));
  });
};