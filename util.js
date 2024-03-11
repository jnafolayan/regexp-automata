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

function bytesToHex(bytes) {
  return Array.from(
    bytes, 
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.substring(i*2, i*2+2), 16);
    bytes[i] = byte;
  }
  return bytes;
}

function encodeString(string) {
  return btoa(bytesToHex(new TextEncoder().encode(string)));
}

function decodeString(string) {
  return new TextDecoder().decode(hexToBytes(atob(string)));
}
