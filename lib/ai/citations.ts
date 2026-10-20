export function exactCitationLine(source: string, quote: string) {
  const index = source.indexOf(quote);
  return index < 0
    ? null
    : source.slice(0, index).split("\n").length;
}
