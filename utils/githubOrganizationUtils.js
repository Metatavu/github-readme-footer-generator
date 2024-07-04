
import { config } from "dotenv";
import { Octokit } from "@octokit/core";

config();
const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });

export async function getOrganizationRepositories(org) {
    try {
        const response = await octokit.request('GET /orgs/{org}/repos', {
            org,
            type: 'public',
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        const repositories = response.data.map(repo => ({
            owner: repo.owner.login,
            repository: repo.name
        }));
        return repositories;

    } catch (error) {
        console.error("Error fetching repositories:", error);
    }
}

export async function getMockRepos() {
    const data = [
        {
            owner: "Essomatic",
            repository: "testgraphQL"
        },
        {
            owner: "Essomatic",
            repository: "secondTest"
        },
    ]

    return data;
}

