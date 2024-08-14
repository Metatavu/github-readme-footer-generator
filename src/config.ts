import { config as dotenvConfig } from "dotenv";
import { cleanEnv, str, json } from "envalid";
import { Repository } from "./types/types";

dotenvConfig();

/**
 * Type describing config
 * 
 */
interface Config {
  GITHUB_TOKEN: string;
  ORG: string;
  UPDATE_BRANCH_NAME: string;
  OVERRIDE_REPOS: Repository[];
}

/**
 * Validate and load environment variables
*/
const env = cleanEnv(process.env, {
  GITHUB_TOKEN: str(),
  ORG: str(),
  UPDATE_BRANCH_NAME: str(),
  OVERRIDE_REPOS: json<Repository[]>({ default: [] }),
});

/**
 * Configuration object containing validated environment variables.
 */
export const config: Config = {
  GITHUB_TOKEN: env.GITHUB_TOKEN,
  ORG: env.ORG,
  UPDATE_BRANCH_NAME: env.UPDATE_BRANCH_NAME,
  OVERRIDE_REPOS: env.OVERRIDE_REPOS,
};