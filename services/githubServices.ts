import { Octokit } from "@octokit/core";
import { Repository } from "../types/types";

const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });


/**
 * Gets the specified branch reference.
 * @param {Repository} params - The owner and repository name.
 * @param {string} branchName - The name of the branch.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const getBranch = async ({ owner, repository }: Repository, branchName: string): Promise<any> => {
  return await octokit.request(`GET /repos/${owner}/${repository}/git/ref/heads/${branchName}`);
};

/**
 * Deletes the specified branch.
 * @param {Repository} params - The owner and repository name.
 * @param {string} branchName - The name of the branch.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const deleteBranch = async ({ owner, repository }: Repository, branchName: string): Promise<any> => {
  return await octokit.request(`DELETE /repos/${owner}/${repository}/git/refs/heads/${branchName}`);
};

/**
 * Gets the latest commit reference for the specified branch.
 * @param {Repository} params - The owner and repository name.
 * @param {string} ref - The branch reference.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const getLatestCommit = async ({ owner, repository }: Repository, ref: string): Promise<any> => {
  return await octokit.request("GET /repos/{owner}/{repository}/git/ref/heads/{ref}", {
    owner,
    repository,
    ref
  });
};

/**
 * Creates a new branch from the specified commit SHA.
 * @param {Repository} params - The owner and repository name.
 * @param {string} branchName - The name of the new branch.
 * @param {string} sha - The commit SHA to create the branch from.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const createBranch = async ({ owner, repository }: Repository, branchName: string, sha: string): Promise<any> => {
  return await octokit.request("POST /repos/{owner}/{repository}/git/refs", {
    owner,
    repository,
    ref: `refs/heads/${branchName}`,
    sha
  });
};

/**
 * Fetches the README file from the repositoryes develop branch.
 * @param {Repository} params - The owner and repository name.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const fetchReadme = async ({ owner, repository }: Repository): Promise<any> => {
  return await octokit.request("GET /repos/{owner}/{repository}/contents/{path}", {
    owner,
    repository,
    path: "README.md",
    ref: "develop"
  });
};

/**
 * Creates a new blob with the specified content.
 * @param {Repository} params - The owner and repository name.
 * @param {string} content - The content of the blob.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const createBlob = async ({ owner, repository }: Repository, content: string): Promise<any> => {
  return await octokit.request("POST /repos/{owner}/{repository}/git/blobs", {
    owner,
    repository,
    content,
    encoding: "base64"
  });
};

/**
 * Gets the commit reference for the specified branch.
 * @param {Repository} params - The owner and repository name.
 * @param {string} ref - The branch reference.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const getCommitRef = async ({ owner, repository }: Repository, ref: string): Promise<any> => {
  return await octokit.request("GET /repos/{owner}/{repository}/git/ref/{ref}", {
    owner,
    repository,
    ref: `heads/${ref}`
  });
};

/**
 * Gets the base tree for the specified commit SHA.
 * @param {Repository} params - The owner and repository name.
 * @param {string} tree_sha - The commit SHA.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const getBaseTree = async ({ owner, repository }: Repository, tree_sha: string): Promise<any> => {
  return await octokit.request("GET /repos/{owner}/{repository}/git/trees/{tree_sha}", {
    owner,
    repository,
    tree_sha
  });
};

/**
 * Creates a new tree with the specified base tree, path, and SHA.
 * @param {Repository} params - The owner and repository name.
 * @param {string} base_tree - The base tree SHA.
 * @param {string} path - The path for the new tree.
 * @param {string} sha - The SHA for the new tree.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const createTree = async ({ owner, repository }: Repository, base_tree: string, sha: string): Promise<any> => {
  return await octokit.request("POST /repos/{owner}/{repository}/git/trees", {
    owner,
    repository,
    base_tree,
    tree: [{
      path: "README.md",
      mode: "100644",
      type: "blob",
      sha
    }]
  });
};

/**
 * Creates a new commit with the specified message, tree, and parents.
 * @param {Repository} params - The owner and repository name.
 * @param {string} message - The commit message.
 * @param {string} tree - The tree SHA.
 * @param {string[]} parents - The parent SHAs.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const createCommit = async ({ owner, repository }: Repository, message: string, tree: string, parents: string[]): Promise<any> => {
  return await octokit.request("POST /repos/{owner}/{repository}/git/commits", {
    owner,
    repository,
    message,
    tree,
    parents
  });
};

/**
 * Updates the reference to point to the specified SHA.
 * @param {Repository} params - The owner and repository name.
 * @param {string} ref - The reference to update.
 * @param {string} sha - The SHA to point the reference to.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const updateRef = async ({ owner, repository }: Repository, ref: string, sha: string): Promise<any> => {
  return await octokit.request("PATCH /repos/{owner}/{repository}/git/refs/{ref}", {
    owner,
    repository,
    ref: `heads/${ref}`,
    sha
  });
};

/**
 * Creates a new pull request with the specified details.
 * @param {Repository} params - The owner and repository name.
 * @param {string} title - The title of the pull request.
 * @param {string} head - The name of the branch where changes are implemented.
 * @param {string} base - The name of the branch you want the changes pulled into.
 * @param {string} body - The body text of the pull request.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const createPullRequest = async ({ owner, repository }: Repository, title: string, head: string, base: string, body: string): Promise<any> => {
  return await octokit.request("POST /repos/{owner}/{repository}/pulls", {
    owner,
    repository,
    title,
    head,
    base,
    body
  });
};

/**
 * Merges the specified pull request.
 * @param {Repository} params - The owner and repository name.
 * @param {number} pullNumber - The number of the pull request.
 * @returns {Promise<any>} The response from the GitHub API.
 */
export const mergePullRequest = async ({ owner, repository }: Repository, pullNumber: number): Promise<any> => {
  return await octokit.request("PUT /repos/{owner}/{repository}/pulls/{pull_number}/merge", {
    owner,
    repository,
    pull_number: pullNumber,
    merge_method: "merge"
  });
};
