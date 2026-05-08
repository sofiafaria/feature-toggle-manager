import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  env: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret",
  admin: {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "admin",
  },
  apim: {
    subscriptionId: process.env.APIM_SUBSCRIPTION_ID ?? "",
    resourceGroup: process.env.APIM_RESOURCE_GROUP ?? "",
    serviceName: process.env.APIM_SERVICE_NAME ?? "",
  },
  redis: {
    defaultUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    perContext: {
      "dev-cloud": process.env.REDIS_URL_DEV_CLOUD,
      "dev-selfhost": process.env.REDIS_URL_DEV_SELFHOST,
      "qa-cloud": process.env.REDIS_URL_QA_CLOUD,
      "qa-selfhost": process.env.REDIS_URL_QA_SELFHOST,
      "pre-cloud": process.env.REDIS_URL_PRE_CLOUD,
      "pre-selfhost": process.env.REDIS_URL_PRE_SELFHOST,
      "prd-cloud": process.env.REDIS_URL_PRD_CLOUD,
      "prd-selfhost": process.env.REDIS_URL_PRD_SELFHOST,
    } as Record<string, string | undefined>,
  },
};
