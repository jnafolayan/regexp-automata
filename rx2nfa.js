const EPSILON = "ϵ";

function convertRegexToNFA(regex) {
  const [finalState, _i] = parseExpression(regex, 0, "", createState());
  const start = findStartFromFinal(finalState);
  labelStates(start);

  start._isStart = true;
  finalState._isFinal = true;

  const nodes = getNodes(start);
  return [nodes, getTransitions(nodes), start];
}

function parseExpression(regex, i = 0, stopCharacter = "", prevState = null) {
  while (i < regex.length) {
    if (regex[i] === stopCharacter) {
      break;
    } else if (regex[i] == "(") {
      // We're entering a group. Parse it and add a transition from prev.
      const [groupExit, endIndex] = parseExpression(
        regex,
        i + 1,
        ")",
        createState()
      );
      const groupEntry = findStartFromFinal(groupExit);
      groupExit.prev = prevState;

      fixBacktrackLinks(groupEntry, prevState);
      transplantState(groupEntry, prevState);
      prevState = groupExit;

      i = endIndex;
    } else if (regex[i] == EPSILON || isAlphanum(regex[i])) {
      const endState = createState();
      endState.prev = prevState;
      prevState != null && addTransition(prevState, regex[i], endState);
      prevState = endState;
    } else if (isQuantifier(regex[i])) {
      assert(prevState != null, "No sequence to quantify");

      const entry = createState();
      const exit = createState();
      exit.prev = entry;

      switch (regex[i]) {
        case "*":
          fixBacktrackLinks(prevState.prev, entry);
          addTransition(entry, EPSILON, prevState.prev);

          addTransition(entry, EPSILON, exit);

          addTransition(prevState, EPSILON, exit);
          addTransition(prevState, EPSILON, prevState.prev);
          break;
        default:
          throw new Error("Unimplemented quantifier: " + regex[i]);
      }

      prevState = exit;
    } else if (regex[i] == "|") {
      const entry = createState();
      const exit = createState();
      exit.prev = entry;

      const rhsEntry = findStartFromFinal(prevState);
      const rhsExit = prevState;
      addTransition(entry, EPSILON, rhsEntry);
      addTransition(rhsExit, EPSILON, exit);

      const [lhsExit, endIndex] = parseExpression(
        regex,
        i + 1,
        stopCharacter,
        createState()
      );
      const lhsEntry = findStartFromFinal(lhsExit);
      addTransition(entry, EPSILON, lhsEntry);
      addTransition(lhsExit, EPSILON, exit);

      i = endIndex;
      prevState = exit;

      if (stopCharacter !== "") {
        // Stop if we were parsing a group.
        break;
      }
    } else {
      throw new Error("Unknown symbol: " + regex[i]);
    }

    i++;
  }

  return [prevState, i];
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

function createState(label = "") {
  return {
    id: createState._stateID++,
    label,
    transitions: [],
    backtracks: [],
    prev: null,

    // internal props
    _isStart: false,
    _isFinal: false,
  };
}

createState._stateID = 0;

function addTransition(state, input, end) {
  const t = createTransition(state, input, end);
  const reverseT = createTransition(end, input, state);
  state.transitions.push(t);
  end.backtracks.push(reverseT);
  return t;
}

function createTransition(_start, input, end) {
  return { input, end };
}

function getTransitions(nodes) {
  return nodes.flatMap((node) =>
    node.transitions.map(({ end, input }) => ({
      from: node.id,
      to: end.id,
      input,
    }))
  );
}

function fixBacktrackLinks(oldState, newState) {
  let backtracks = oldState.backtracks;
  oldState.backtracks = [];

  backtracks.forEach((t) => {
    const { end, input } = t;
    end.transitions = end.transitions.filter((tt) => tt.end !== oldState);
    addTransition(end, input, newState);
  });
}

function transplantState(oldState, newState) {
  const transitions = oldState.transitions;
  oldState.transitions = [];
  transitions.forEach(({ input, end }) => {
    end.backtracks = end.backtracks.filter((tt) => tt.end !== oldState);
    addTransition(newState, input, end);
  });
}

function findStartFromFinal(final) {
  const states = [final];
  const checked = new Set();

  while (states.length) {
    const s = states.shift();
    if (checked.has(s)) continue;
    checked.add(s);

    if (s.backtracks.length === 0) return s;
    states.push(...s.backtracks.map((t) => t.end));
  }

  return null;
}

function isAlphanum(char) {
  return /[a-z0-9 ]/i.test(char);
}

function isQuantifier(char) {
  return ["*"].includes(char);
}

function labelStates(start) {
  const nodes = getNodes(start);
  const ordered = topoSort(nodes).reverse();
  ordered.forEach((node, i) => {
    node.label = i;
  });
}

function topoSort(nodes) {
  const stack = [];
  const visited = new Set();

  for (const node of nodes) {
    topoSortUtil(node, stack, visited);
  }

  return stack;
}

function topoSortUtil(node, stack, visited) {
  if (visited.has(node)) {
    return;
  }

  visited.add(node);

  for (const { end: adj } of node.transitions.reverse()) {
    topoSortUtil(adj, stack, visited);
  }

  stack.push(node);
}

function graphBFS(start, onTraverse) {
  const states = [start];
  const checked = new Set();

  while (states.length) {
    const s = states.shift();
    if (checked.has(s)) continue;
    checked.add(s);
    states.push(...s.transitions.map((t) => t.end));

    onTraverse && onTraverse(s);
  }

  return Array.from(checked);
}

function getNodes(start) {
  return graphBFS(start);
}

function print(start) {
  graphBFS(start, (s) => {
    s.transitions.forEach((t) => {
      console.log(`${s.label} --${t.input}-- ${t.end.label}`);
    });
    states.push(...s.transitions.map((t) => t.end));
  });
}
