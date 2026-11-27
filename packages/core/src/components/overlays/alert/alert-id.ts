let alertIds = 0

/** Counter-based id; `crypto.randomUUID` is undefined outside secure contexts (plain HTTP on non-localhost). */
export const createAlertId = (): string => `ds-alert-${alertIds++}`
