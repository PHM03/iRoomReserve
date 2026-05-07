export const RESERVATION_CAMPUSES = ["digi", "main"] as const;

export type ReservationCampus = (typeof RESERVATION_CAMPUSES)[number];

const CAMPUS_ALIASES: Record<string, ReservationCampus> = {
  digi: "digi",
  digital: "digi",
  "digital campus": "digi",
  "digi campus": "digi",
  "sdca digital campus": "digi",
  "sdca digi campus": "digi",
  "sdca-digital-campus": "digi",
  "digital building": "digi",
  main: "main",
  "main campus": "main",
  "sdca main campus": "main",
  "sdca-main-campus": "main",
  gd1: "main",
  gd2: "main",
  gd3: "main",
  "gd 1": "main",
  "gd 2": "main",
  "gd 3": "main",
  "gd-1": "main",
  "gd-2": "main",
  "gd-3": "main",
  "gd1 main campus": "main",
  "gd2 main campus": "main",
  "gd3 main campus": "main",
};

export function normalizeCampus(value?: string | null): ReservationCampus | null {
  if (!value) {
    return null;
  }

  return CAMPUS_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function inferCampusFromBuilding(input: {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  campus?: string | null;
}): ReservationCampus | null {
  const searchValue = [input.id, input.code, input.name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .trim()
    .toLowerCase();

  if (/\bgd[\s-]?[123]\b/.test(searchValue)) {
    return "main";
  }

  if (
    searchValue.includes("digital campus") ||
    searchValue.includes("digi campus") ||
    searchValue.includes("sdca-digital-campus")
  ) {
    return "digi";
  }

  return (
    normalizeCampus(input.campus) ??
    normalizeCampus(input.id) ??
    normalizeCampus(input.code) ??
    normalizeCampus(input.name)
  );
}
