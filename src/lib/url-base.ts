export function obtenerUrlBase(): string {
  const urlConfigurada = process.env.APP_URL?.trim();
  if (urlConfigurada) {
    return urlConfigurada.replace(/\/$/, '');
  }

  if (
    process.env.VERCEL_ENV === 'production' &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}
