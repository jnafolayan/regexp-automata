parse("a(b)c")

function parse(regex) {
  const start = createState();
  const [_finalState, _i] = parseExpression(regex, 0, "", start);
  console.log(JSON.stringify(start, null, 4));
}

function parseExpression(regex, i = 0, stopCharacter = "", prevState = null) {
  while (i < regex.length || regex[i] === stopCharacter) 
  {
    if (regex[i] == "(") 
    {
      // We're entering a group. Parse it and add a transition from prev.
      const [groupNode, endIndex] = parseExpression(regex, i + 1, ")", prevState);
      prevState = groupNode;
      i = endIndex;
    } 
    else if (isLetter(regex[i])) 
    {
      const endState = createState();
      addTransition(prevState, regex[i], endState);
      prevState = endState;
    }

    i++;
  }

  return [prevState, i];
}

function createState(label = "") {
  return {
    label,
    transitions: [],
  };
}

function addTransition(state, input, end) {
  state.transitions.push(createTransition(state, input, end));
}

function createTransition(_start, input, end) {
  return { input, end };
}

// util
function isLetter(char) {
  return /[a-z]/i.test(char);
}