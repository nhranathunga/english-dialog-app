const NUM_MAP = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
};

export function normalize(s = "") {
  let text = s.toLowerCase();
  
  // Replace numbers 0-10 with words
  text = text.replace(/\b(10|[0-9])\b/g, (match) => NUM_MAP[match] || match);

  return text
    .replace(/[’']/g, "'") // Normalize apostrophes
    .replace(/[^a-z0-9\s']/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export function tokenize(s = "") {
  const n = normalize(s);
  return n ? n.split(" ") : [];
}
