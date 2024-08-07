import { Octokit } from "@octokit/core";
import { Repository } from "../types/types";

const octokit = new Octokit({ });

/**
 * Fetches all public repositories belonging to the specified organization from GitHub and filters out archived repos.
 * 
 * @param org - The name of the organization.
 * @returns A Promise that resolves to an array of Repository objects.
 * @throws If there is an error fetching repositories from GitHub.
 */
export async function getOrganizationPublicRepositories(org: string): Promise<Repository[]> {
  try {
    const response = await octokit.request("GET /orgs/{org}/repos", {
      org,
      type: "public",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const nonArchivedRepos = response.data.filter(repo => !repo.archived);

    const repositories = nonArchivedRepos.map((repo: any) => ({
      owner: repo.owner.login,
      repository: repo.name
    }));
    return repositories;

  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error
  }
};