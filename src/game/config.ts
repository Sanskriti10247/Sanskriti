/** Tuning values for the driving game, kept in one place so the feel is easy to adjust. */
export const GAME = {
  roundSeconds: 60,
  countdownSeconds: 3,
  /** Radius of the island's grassy top. */
  islandRadius: 46,
  /** The car is kept inside this radius. */
  driveRadius: 41,
  roadWidth: 7,
  heartCount: 12,
  /** Seconds before a collected bonus star appears somewhere new. */
  starRespawnSeconds: 7,
  bestScoreKey: 'pink-drive-best',
} as const;

export const CAR = {
  /** Collision radius of the car body. */
  radius: 1.25,
  acceleration: 21,
  braking: 36,
  reverseMax: 9,
  roadMaxSpeed: 27,
  offroadMaxSpeed: 15,
  boostMultiplier: 1.45,
  boostSeconds: 1.4,
  steerRate: 2.35,
  roadGrip: 9,
  offroadGrip: 5.5,
  driftGrip: 1.9,
} as const;
