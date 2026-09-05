export function assertCronSecret(value?: string) {
  const secret = process.env["CRON_SECRET"];
  if (!secret || value !== secret) throw new Error("Unauthorized");
}
