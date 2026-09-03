export const APP_VERSION = "0.1.1-alpha";
export const APP_CHANNEL = "alpha";
export const APP_REVISION = "0.1.1";
export const APP_RELEASED = "2026-09-02";
export const APP_CODENAME = "First glass";

export type VersionInfo = {
  version: string;
  channel: string;
  revision: string;
  released: string;
  codename: string;
};

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    channel: APP_CHANNEL,
    revision: APP_REVISION,
    released: APP_RELEASED,
    codename: APP_CODENAME,
  };
}
