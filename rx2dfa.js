const DEAD_STATE = -1;

function convertRegexToDFA(regex) {
  const [nodes, transitions, start] = convertRegexToNFA(regex);
  const symbols = extractAlphabetFromTransitions(transitions);

  const nodesMap = arrayToObject(nodes, "label");

  // Helper function to memoize closures
  const knownClosures = {};
  function getClosureWrap(nodes, state) {
    if (!knownClosures[state]) {
      knownClosures[state] = getClosure(nodes, state);
    }
    return knownClosures[state];
  }

  let stateLabelID = 0;
  const dfaStateReports = {};
  const dfaStatesToExplore = [
    createDFAState(
      getDFAStateLabel(stateLabelID++),
      getClosureWrap(nodesMap, start.label)
    ),
  ];
  const exploredDFAStates = [];
  const dfaTransitions = [];
  while (dfaStatesToExplore.length) {
    const dfaState = dfaStatesToExplore.shift();
    const { label, states } = dfaState;
    exploredDFAStates.push(dfaState);
    dfaStateReports[label] = {};

    symbols.forEach((symbol) => {
      // Compute Move(DFA_state, symbol)
      const move = states
        .map((state) => transitionFn(nodesMap, state, symbol))
        // Remove dead states
        .filter((state) => state != DEAD_STATE);

      // Abort if there are no reachable states on `symbol`
      if (move.length == 0) return;

      // Compute E-closure(move)
      const closure = sortStates(
        uniqArray(move.flatMap((state) => getClosureWrap(nodesMap, state)))
      );

      dfaStateReports[label][symbol] = { move, closure };

      let foundDFAState = findDFAStateUsingNFAStates(
        dfaStatesToExplore.concat(exploredDFAStates),
        closure
      );
      if (foundDFAState == null) {
        foundDFAState = createDFAState(
          getDFAStateLabel(stateLabelID++),
          closure
        );
        dfaStatesToExplore.push(foundDFAState);
      }

      dfaTransitions.push(
        createDFATransition(label, symbol, foundDFAState.label)
      );
    });
  }

  if (exploredDFAStates.length) {
    exploredDFAStates[0]._isStart = true;

    const nfaFinalState = nodes.find((node) => node._isFinal);
    for (const state of exploredDFAStates) {
      if (state.states.includes(nfaFinalState.label)) {
        state._isFinal = true;
      }
    }
  }

  return [
    exploredDFAStates,
    dfaTransitions,
    exploredDFAStates[0],
    { dfaStateReports },
  ];
}

function createDFAState(label, nfaStates) {
  return {
    label,
    id: label,
    states: nfaStates,

    // internal props
    _isStart: false,
    _isFinal: false,
  };
}

function createDFATransition(from, input, to) {
  return { from, input, to };
}

function findDFAStateUsingNFAStates(dfaStates, nfaStates) {
  return dfaStates.find((s) => arraysEqual(s.states, nfaStates));
}

function getDFAStateLabel(i) {
  return String.fromCharCode(65 + i);
}

function transitionFn(nodesMap, state, symbol) {
  for (const { end, input } of nodesMap[state].transitions) {
    if (input === symbol) return end.label;
  }

  return DEAD_STATE;
}

function extractAlphabetFromTransitions(transitions) {
  const symbolsWithMaybeEpsilon = uniqArray(transitions.map((tr) => tr.input));
  // remove epsilon
  return symbolsWithMaybeEpsilon.filter((sym) => sym != EPSILON);
}

function getClosure(nodes, state) {
  const states = [];
  const open = [state];
  const checked = new Set();

  while (open.length) {
    const cur = open.pop();
    if (checked.has(cur)) continue;

    checked.add(cur);
    states.push(cur);

    nodes[cur].transitions.forEach(({ end, input }) => {
      if (input === EPSILON) {
        open.push(end.label);
      }
    });
  }

  // Always return a sorted list
  return sortStates(states);
}

function sortStates(states) {
  return states.sort((a, b) => a - b);
}
