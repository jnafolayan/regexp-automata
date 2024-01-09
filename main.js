const EPSILON = "ϵ";

const nfa = {
  states: {},
};

parse("b*")

function parse(regex) {
  const [finalState, _i] = parseExpression(regex, 0, "", createState());

  const start = findStartFromFinal(finalState);

  labelStates(start);
  print(start);
}

function parseExpression(regex, i = 0, stopCharacter = "", prevState = null) {
  while (i < regex.length) 
  {
    if (regex[i] === stopCharacter) 
    {
      break;
    }
    else if (regex[i] == "(") 
    {
      // We're entering a group. Parse it and add a transition from prev.
      const [groupExit, endIndex] = parseExpression(regex, i + 1, ")", prevState);
      groupExit.prev = prevState;
      prevState = groupExit;
      i = endIndex;
    } 
    else if (isLetter(regex[i])) 
    {
      const endState = createState();
      endState.prev = prevState;
      prevState != null && addTransition(prevState, regex[i], endState);
      prevState = endState;
    }
    else if (isQuantifier(regex[i]))
    {
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
    }
    else
    {
      throw new Error("Unknown symbol: " + regex[i]);
    }

    i++;
  }

  return [prevState, i];
}

function assert(cond, message) {
  if (!cond) 
  {
    throw new Error(message);
  }
}

function createState(label = "") {
  return {
    label,
    transitions: [],
    backtracks: [],
    prev: null,
  };
}

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

function fixBacktrackLinks(oldState, newState) {
  let backtracks = oldState.backtracks;
  oldState.backtracks = [];

  backtracks.forEach(t => {
    const { end, input } = t;
    end.transitions = end.transitions.filter(tt => tt !== oldState);
    addTransition(end, input, newState);
  });
}

// util
function isLetter(char) {
  return /[a-z]/i.test(char);
}

function isQuantifier(char) {
  return ["*"].includes(char);
}

function findStartFromFinal(final) {
  const states = [final];
  const checked = new Set();

  while (states.length) {
    const s = states.shift();
    if (checked.has(s)) continue;
    checked.add(s);

    if (s.backtracks.length === 0) return s;
    states.push(...s.backtracks.map(t => t.end));
  }

  return null;
}

function labelStates(state) {
  let i = 0;
  const states = [state];
  const checked = new Set();
  while (states.length) {
    const s = states.pop();
    if (checked.has(s)) continue;
    checked.add(s);
    s.label = i++;
    states.push(...s.transitions.map(t => t.end));
  }
}

function print(state) {
  const states = [state];
  const checked = new Set();

  while (states.length) {
    const s = states.shift();
    if (checked.has(s)) continue;
    checked.add(s);
    s.transitions.forEach(t => {
      console.log(`${s.label} --${t.input}-- ${t.end.label}`);
    });
    states.push(...s.transitions.map(t => t.end));
  }
}