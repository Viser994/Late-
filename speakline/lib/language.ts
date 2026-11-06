export function languageLabel(code: string | null | undefined): string {
  if (!code) return "Language not detected";
  const hyphenated = code.replace(/_/g, "-");
  const canonical = hyphenated
    .split("-")
    .map((part, index) => (index === 0 ? part.toLowerCase() : part.toUpperCase()))
    .join("-");
  try {
    const names = new Intl.DisplayNames(["en"], { type: "language" });
    const label = names.of(canonical) ?? names.of(canonical.split("-")[0]);
    if (label && label.toLowerCase() !== canonical.toLowerCase()) {
      return label;
    }
  } catch {
    return code;
  }
  return code;
}
