import { config } from "dotenv";
import { Octokit } from "@octokit/core";
import { Repository } from "../types/types";

config();
const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });

/**
 * Fetches all public repositories belonging to the specified organization from GitHub.
 * 
 * @param org - The name of the organization.
 * @returns A Promise that resolves to an array of Repository objects.
 * @throws If there is an error fetching repositories from GitHub.
 */
export async function getOrganizationRepositories(org: string): Promise<Repository[]> {
  try {
    const response = await octokit.request("GET /orgs/{org}/repos", {
      org,
      type: "public",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const repositories = response.data.map((repo: any) => ({
      owner: repo.owner.login,
      repository: repo.name
    }));
    return repositories;

  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error
  }
};