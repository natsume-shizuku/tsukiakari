/** Engineering fixtures stay resolvable for saved decks, but learners only see them with this developer flag. */
const flag = 'tsukiakari.showFixtures';
function readFlag(): boolean {
  try { return globalThis.localStorage?.getItem(flag) === 'on'; } catch { return false; }
}
export const fixturesVisible = readFlag();
