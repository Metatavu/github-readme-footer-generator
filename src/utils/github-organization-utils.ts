import { Octokit } from "@octokit/core";
import { Repository } from "../types/types";

const octokit = new Octokit({ });

/**
 * Fetches all public repositories belonging to the specified organization from GitHub and filters out archived/forked repos.
 * 
 * @param org - The name of the organization.
 * @returns A Promise that resolves to an array of Repository objects.
 * @throws If there is an error fetching repositories from GitHub.
 */
export async function getOrganizationPublicRepositories(org: string): Promise<Repository[]> {
  try {
    const repositories: Repository[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.request("GET /orgs/{org}/repos", {
        org,
        type: "public",
        per_page: 100,
        page,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      const nonForkedNonArchivedRepos = response.data.filter((repo: any) => !repo.fork && !repo.archived);

      const pageRepositories = nonForkedNonArchivedRepos.map((repo: any) => ({
        owner: repo.owner.login,
        repository: repo.name
      }));

      repositories.push(...pageRepositories);

      if (response.data.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return repositories;

  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
};
