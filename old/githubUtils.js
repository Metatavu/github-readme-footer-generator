import { config } from "dotenv";
import { Octokit } from "@octokit/core";
import { checkForExistingFooter, createOrOverwriteFooter } from "../utils/footerUtils.js";

config();
// Get environment variables
const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });


//THIS is no longer in use, script updates readme with PUT request deprecated by new method making pull requests and automerge


export async function fetchReadme(owner, repo) {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/README.md', {
            owner,
            repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        // Decode the Base64-encoded content to text
        const readmeContent = decodeBase64Content(response.data.content)
        const SHA = response.data.sha
        return { readmeContent: readmeContent, SHA: SHA };

    } catch (error) {
        console.error("Error fetching README:", error);
    }
}

export async function updateReadme(owner, repo, path, content, sha) {
    try {
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path,
            message: 'Updated README.md',
            content,
            sha,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
    } catch (error) {
        console.error("Error updating README:", error);
    }
}

export function encodeToBase64(content) {
    return Buffer.from(content).toString('base64');
}

export function decodeBase64Content(base64Content) {
    return Buffer.from(base64Content, 'base64').toString('utf-8');
}

export async function getSHA(owner, repo, path) {
    // Get the SHA of the current README file
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: "README.md",
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    return response.data.sha;
}
//TODO add the ones with footer to list and ask user to select which to overwrite


export async function updateRepository(owner, repoName, footer, overwriteExistingFooter) {
    // Fetch the current README content
    const fetchedReadme = await fetchReadme(owner, repoName);

    // If README does not exist or failed to fetch, return
    if (!fetchedReadme) { return; }
    const readmeContent = fetchedReadme.readmeContent;
    const readmeSHA = fetchedReadme.SHA;

    const hasCustomFooter = checkForExistingFooter(readmeContent);

    // Determine if we need to update the footer
    let updatedContent = readmeContent;
    //if overwrite OR does not have footer already
    if (overwriteExistingFooter || !hasCustomFooter) {
        updatedContent = createOrOverwriteFooter(readmeContent, footer, overwriteExistingFooter, repoName);
    }
    // If no updates are made to the content, return early
    if (updatedContent === readmeContent) {
        console.log("Repository:", repoName, " was not changed.")
        return;
    }

    const base64UpdatedContent = encodeToBase64(updatedContent);
    // Update the README file with the new content
    await updateReadme(owner, repoName, "README.md", base64UpdatedContent, readmeSHA);
}


export async function updateRepositories(repositoriesOBJ, footer, overwriteExistingFooter) {
    await repositoriesOBJ.forEach(repo => {
        updateRepository(repo.owner, repo.repository, footer, overwriteExistingFooter)
    });
}
