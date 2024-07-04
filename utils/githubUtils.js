import { config } from "dotenv";
import { Octokit } from "@octokit/core";
import { encodeToBase64, decodeBase64Content } from "./utils.js";
import { checkForExistingFooter, createOrOverwriteFooter } from "./footerUtils.js";
import prompt from 'prompt-sync';

config();
const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });

const promptSync = prompt();


// Delete branch if it exists, or log if it doesn't
async function deleteBranchIfExists(owner, repo, branchName) {
    try {
        await octokit.request(`GET /repos/${owner}/${repo}/git/ref/heads/${branchName}`);

        // Branch exists, delete it
        await octokit.request(`DELETE /repos/${owner}/${repo}/git/refs/heads/${branchName}`);
        console.log("Deleted existing branch:", `\x1b[36m${branchName}\x1b[0m`, "in repository:", `\x1b[35m${repo}\x1b[0m`);
    } catch (error) {
        if (error.status === 404) {
            console.log("Branch", `\x1b[36m${branchName}\x1b[0m`, "does not exist in repository", `\x1b[35m${repo}\x1b[0m`, "Proceeding...");
        } else {
            console.error("Error deleting branch:", error);
            throw error;
        }
    }
}

async function createBranchFromDevelop(owner, repo, branchName) {
    try {
        const latestCommit = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
            owner,
            repo,
            ref: 'develop'
        });

        await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: latestCommit.data.object.sha
        });
        console.log("Created branch:", `\x1b[36m${branchName}\x1b[0m`, "from the latest develop commit for repository:", `\x1b[35m${repo}\x1b[0m`);
        return { hasDevelop: true };
    } catch (error) {
        if (error.status === 404) {
            console.log("Develop branch not found in repository:", `\x1b[35m${repo}\x1b[0m`);
        } else {
            console.error("Error creating branch from develop in repository:", `\x1b[35m${repo}\x1b[0m`, "Error:", error);
        }
        return { hasDevelop: false };
    }
}

//fetch repos readme
async function fetchReadme(owner, repo) {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: 'README.md',
            ref: 'develop'
        });

        const content = decodeBase64Content(response.data.content);

        return {
            readmeContent: content,
            SHA: response.data.sha
        };
    } catch (error) {
        console.error("Error fetching README:", error);
        return null;
    }
}

//update readme if it exists
async function updateReadme(owner, repo, branchName, footer, overwriteExistingFooter) {
    const path = 'README.md';

    const fetchedReadme = await fetchReadme(owner, repo);

    if (!fetchedReadme) {
        return { updated: false };
    }

    const originalReadmeContent = fetchedReadme.readmeContent;

    const hasCustomFooter = checkForExistingFooter(originalReadmeContent);

    let updatedContent = originalReadmeContent;

    // If we are not overwriting all and there is already a footer, prompt the user
    if (!overwriteExistingFooter && hasCustomFooter) {
        console.log("metatavu-custom-footer exists already! Do you want to overwrite the existing footer for", `\x1b[35m${owner}/${repo}\x1b[0m?`,"(y/n)")
        const answer = promptSync().toLowerCase();

        if (answer !== 'y') {
            console.log("User aborted", `\x1b[35m${owner}/${repo}\x1b[0m`);
            return { updated: false };
        }
    }

    // Overwrite the footer or create a new one
    updatedContent = createOrOverwriteFooter(originalReadmeContent, footer, true, repo);

    if (updatedContent === originalReadmeContent) {
        console.log("Repository:", `\x1b[35m${repo}\x1b[0m`, "original data matched update, nothing was not changed.");
        return { updated: false };
    }

    const base64UpdatedContent = encodeToBase64(updatedContent);

    const blobData = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
        owner,
        repo,
        content: base64UpdatedContent,
        encoding: 'base64'
    });

    const latestCommit = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
        owner,
        repo,
        ref: `heads/${branchName}`
    });

    const baseTree = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
        owner,
        repo,
        tree_sha: latestCommit.data.object.sha
    });

    const newTree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
        owner,
        repo,
        base_tree: baseTree.data.sha,
        tree: [{
            path,
            mode: '100644',
            type: 'blob',
            sha: blobData.data.sha
        }]
    });

    const newCommit = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
        owner,
        repo,
        message: 'Update README',
        tree: newTree.data.sha,
        parents: [latestCommit.data.object.sha]
    });

    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: newCommit.data.sha
    });

    return { updated: true };
}

async function createPullRequest(owner, repo, branchName) {
    try {
        const pullRequest = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
            owner,
            repo,
            title: 'Update README',
            head: branchName,
            base: 'develop',
            body: 'This PR updates the README.'
        });
        console.log("pull request created with number:", pullRequest.data.number)
        return pullRequest;
    } catch (error) {
        console.error("Error creating pull request:", error);
        throw error;
    }
}

async function autoMergePullRequest(owner, repo, pullNumber) {
    try {
        await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
            owner,
            repo,
            pull_number: pullNumber,
            merge_method: 'merge'
        });
        console.log("pull request:", pullNumber, "was auto merged")
    } catch (error) {
        console.error("Error merging pull request:", error);
        throw error;
    }
}

async function updateReadmeAndAutoMerge(owner, repo, footer, overwriteExistingFooter) {
    const branchName = 'update-readme';
    console.log("Begining work on repository:", `\x1b[35m${repo}\x1b[0m`, "with branch of:", `\x1b[36m${branchName}\x1b[0m`)
    try {
        await deleteBranchIfExists(owner, repo, branchName);

        const { hasDevelop } = await createBranchFromDevelop(owner, repo, branchName);
        if (!hasDevelop) {
            console.log("No changes made to", `\x1b[35m${owner}/${repo}\x1b[0m`, "Develop branch not found or latest commit information missing.");
            return;
        }

        const { updated } = await updateReadme(owner, repo, branchName, footer, overwriteExistingFooter);
        if (!updated) {
            console.log("No changes made to", `\x1b[35m${owner}/${repo}\x1b[0m`, "skipping pull request creation.");
            return;
        }

        const pullRequest = await createPullRequest(owner, repo, branchName);
        await autoMergePullRequest(owner, repo, pullRequest.data.number);
    } catch (error) {
        console.error("Error in updateReadmeAndAutoMerge:", error);
    }
}

export async function updateReadmeAndAutoMergeRepositories(repositoriesOBJ, footer) {
    console.log('\x1b[31m%s\x1b[0m', 'Do you want to overwrite ALL existing metatavu-custom-footers for all repositories? (otherwise will be asked individually) (y/n): ');
    const answer = promptSync().toLowerCase();

    const overwriteAll = answer === 'y';
    if (overwriteAll) {
        console.log("All metatavu-custom-footers will be overwritten")
    }

    for (let i = 0; i < repositoriesOBJ.length; i++) {
        const repo = repositoriesOBJ[i];
        console.log("\n", i)
        // If overwriteAll is true, skip the prompt and overwrite all
        if (overwriteAll) {
            await updateReadmeAndAutoMerge(repo.owner, repo.repository, footer, true);
        } else {
            await updateReadmeAndAutoMerge(repo.owner, repo.repository, footer, false);
        }
    }
}

export function displaySelectedRepositories(repositoriesOBJ) {
    console.log("---------Selected Repositories---------");
    for (let i = 0; i < repositoriesOBJ.length; i++) {
        const repo = repositoriesOBJ[i];
        console.log(i, ": ", "Owner:", repo.owner, "Repository:", `\x1b[35m${repo.repository}\x1b[0m`);
    }
    console.log("---------------------------------------");
}