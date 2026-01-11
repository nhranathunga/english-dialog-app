import { normalize, tokenize } from "./text";

function levenshtein(a, b) {
  const A = a, B = b;
  const m = A.length, n = B.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function similarity(a, b) {
  const A = normalize(a);
  const B = normalize(b);
  if (!A && !B) return 1;
  if (!A || !B) return 0;
  const dist = levenshtein(A, B);
  const maxLen = Math.max(A.length, B.length);
  return 1 - dist / maxLen;
}

export function keywordCheck(userText, keywords = []) {
  const u = normalize(userText);
  return keywords.every((k) => u.includes(normalize(k)));
}

export function scoreAttempt(userText, expectedText, keywords = [], mode = "normal") {
  const sim = similarity(userText, expectedText); // 0..1

  const uTok = tokenize(userText);
  const eTok = tokenize(expectedText);
  const eSet = new Set(eTok);
  let hit = 0;
  for (const t of uTok) if (eSet.has(t)) hit++;
  const tokenMatch = eTok.length ? hit / eTok.length : 0;

  const kwOk = keywords.length ? keywordCheck(userText, keywords) : true;

  let pass = false;
  if (mode === "easy") pass = kwOk && tokenMatch >= 0.55;
  else if (mode === "normal") pass = kwOk && (tokenMatch >= 0.7 || sim >= 0.72);
  else pass = sim >= 0.88; // strict

  const score = Math.round(100 * Math.max(sim, tokenMatch));
  return { pass, score, sim, tokenMatch, kwOk };
}

export function buildFeedback(userText, expectedText, keywords, result) {
  if (result.pass) return { tone: "good", html: "✅ Nice! Moving to the next line." };

  const tips = [];
  if (!result.kwOk && keywords?.length) {
    tips.push(`Include these key words: <b>${keywords.join(", ")}</b>.`);
  }

  const u = normalize(userText);
  const e = normalize(expectedText);
  // Very small heuristic tips:
  if ((e.includes("i'm") || e.includes("im")) && !u.includes("im") && !u.includes("i'm")) {
    tips.push(`Remember: say <b>"I'm"</b> (I am).`);
  }

  tips.push(`Tap <b>Listen correct</b>, then try again slowly.`);
  return { tone: "bad", html: `❌ Not quite.<br/>${tips.join("<br/>")}` };
}
