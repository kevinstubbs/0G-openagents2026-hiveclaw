/** Entry for callers that need env-based config (CLI, Next routes). Keeps `config.ts` off the main barrel so bundles can tree-shake `process.env` reads. */
export { loadHiveclawConfig } from "./config.js";
