function uniqArray(arr) {
  return Array.from(new Set(arr));
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

function arrayToObject(arr, keyProp) {
  return arr.reduce((obj, item) => {
    obj[item[keyProp]] = item;
    return obj;
  }, {});
}
