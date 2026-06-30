import { ScoreBreakdown, UsernameRow } from "../types";

const dictionary = new Set([
  "mint",
  "orbit",
  "pixel",
  "nova",
  "raticate",
  "sandshrew",
  "nidoqueen",
  "atlas",
  "ember",
  "cobalt",
  "lumen",
]);

const suffixes = ["hq", "lab", "ly", "io", "go", "x", "now", "app"];
const prefixes = ["get", "try", "hey", "neo", "ultra", "mini"];
const vowels = new Set(["a", "e", "i", "o", "u"]);

export const validateUsername = (raw: string): { text: string; reason?: string } => {
  const text = raw.trim().toLowerCase();
  if (text.length < 3 || text.length > 35) return { text, reason: "Must be 3-35 characters" };
  if (!/^[a-z0-9._]+$/.test(text)) return { text, reason: "Only a-z, 0-9, dots, and underscores" };
  if (!/[a-z]/.test(text)) return { text, reason: "Must contain at least one letter" };
  if (text.startsWith("www.")) return { text, reason: "Cannot start with www." };
  if (/\.(com|net|org|io|co|app|dev|xyz|ai)$/i.test(text)) return { text, reason: "Looks like a domain name" };
  return { text };
};

const score = (text: string): ScoreBreakdown => {
  const len = text.length;
  const lengthScore = len <= 3 ? 25 : len === 4 ? 22 : len === 5 ? 18 : len === 6 ? 14 : len === 7 ? 10 : Math.max(0, 10 - (len - 7));
  const dictionaryScore = dictionary.has(text) ? 15 : [...dictionary].some((word) => text.includes(word)) ? 8 : 0;
  const purityScore = (/\d/.test(text) ? 0 : 8) + (text.includes("_") ? 0 : 6) + (text.includes(".") ? 0 : 6);
  const vowelCount = [...text].filter((char) => vowels.has(char)).length;
  const brandabilityScore = Math.max(2, Math.min(15, Math.round((vowelCount / len) * 18)));
  const pronounceabilityScore = /[bcdfghjklmnpqrstvwxyz]{4,}/.test(text) ? 3 : Math.min(10, 5 + vowelCount);
  const popularityScore = dictionary.has(text) ? 15 : Math.max(2, 12 - Math.floor(len / 2));
  return { lengthScore, dictionaryScore, purityScore, brandabilityScore, pronounceabilityScore, popularityScore };
};

const toRow = (raw: string, id: number, category = "smart", source = "local-demo"): UsernameRow => {
  const validation = validateUsername(raw);
  const breakdown = score(validation.text);
  const totalScore = Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  return {
    id,
    text: validation.text,
    length: validation.text.length,
    category,
    source,
    status: validation.reason ? "invalid" : "unknown",
    totalScore,
    notes: validation.reason ?? "",
    favorite: false,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    score: breakdown,
    invalidReason: validation.reason,
  };
};

export const generateLocalCandidates = (seeds: string[], limit: number, startId: number) => {
  const cleanSeeds = seeds.map((seed) => seed.trim().toLowerCase()).filter(Boolean);
  const pool = new Set<string>();
  for (const seed of cleanSeeds) {
    pool.add(seed);
    for (const prefix of prefixes) pool.add(`${prefix}${seed}`);
    for (const suffix of suffixes) pool.add(`${seed}${suffix}`);
    pool.add(seed.replace(/[aeiou]/g, ""));
    pool.add(seed.replace(/c/g, "k"));
    pool.add(seed.replace(/f/g, "ph"));
  }
  for (let i = 0; i < cleanSeeds.length - 1; i += 1) {
    pool.add(`${cleanSeeds[i].slice(0, 4)}${cleanSeeds[i + 1].slice(-4)}`);
    pool.add(`${cleanSeeds[i][0]}${cleanSeeds[i + 1]}`);
  }
  return [...pool].slice(0, limit).map((name, index) => toRow(name, startId + index));
};

export const seedRows: UsernameRow[] = [
  "mint",
  "orbit",
  "nidoqueen",
  "sandshrew",
  "cat_lab",
  "www.apple",
  "777",
  "embergo",
  "lumen",
  "raticate",
].map((name, index) => toRow(name, index + 1, index < 4 ? "wordlist" : "smart"));
