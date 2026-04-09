const DEFAULT_MAX_AGE_DAYS = 7;

/**
 * Returns the cutoff Date before which completed tasks should be excluded.
 * Reads COMPLETED_TASK_MAX_AGE_DAYS from the provided env value.
 * Falls back to 7 days if the value is missing, non-integer, zero, or negative.
 */
export function getCompletedTaskCutoffDate(envValue: string | undefined): Date {
  const days = parseMaxAgeDays(envValue);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

function parseMaxAgeDays(envValue: string | undefined): number {
  if (envValue === undefined || envValue.trim() === "") {
    return DEFAULT_MAX_AGE_DAYS;
  }

  const parsed = Number(envValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(
      `Aviso: COMPLETED_TASK_MAX_AGE_DAYS inválido ("${envValue}"). Usando padrão de ${DEFAULT_MAX_AGE_DAYS} dias.`
    );
    return DEFAULT_MAX_AGE_DAYS;
  }

  return parsed;
}
