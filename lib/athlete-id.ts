import { getSportCode } from "./constants";

/**
 * Generates an Athlete ID in the format: JG-OD-{SPORT_CODE}-{YEAR}-{SEQUENCE}
 * Example: JG-OD-FB-2026-000001
 */
export function generateAthleteId(sport: string, sequence: number): string {
  const code = getSportCode(sport);
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, "0");
  return `JG-OD-${code}-${year}-${seq}`;
}

/**
 * Parses an athlete ID back into its components.
 */
export function parseAthleteId(athleteId: string) {
  const parts = athleteId.split("-");
  if (parts.length !== 6) return null;
  return {
    org: parts[0],
    state: parts[1],
    sportCode: parts[2],
    year: parseInt(parts[3]),
    sequence: parseInt(parts[4] + parts[5]),
  };
}
