export const URGENCY_LEVELS = ["routine", "urgent", "stat", "critical"] as const;

export type Urgency = (typeof URGENCY_LEVELS)[number];

export const URGENCY_PRIORITY: Record<Urgency, number> = {
  critical: 0,
  stat: 1,
  urgent: 2,
  routine: 3,
};
