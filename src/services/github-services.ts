import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types";
import { Repository } from "../types/types";

const TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: TOKEN });

type GetBranchResponse = Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];
type DeleteBranchResponse = Endpoints["DELETE /repos/{owner}/{repo}/git/refs/{ref}"]["response"];
type GetLatestCommitResponse = Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];
type CreateBranchResponse = Endpoints["POST /repos/{owner}/{repo}/git/refs"]["response"]["data"];
type FetchReadmeResponse = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]["data"];
type CreateBlobResponse = Endpoints["POST /repos/{owner}/{repo}/git/blobs"]["response"]["data"];
type GetCommitRefResponse = Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];
type GetBaseTreeResponse = Endpoints["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"]["response"]["data"];
type CreateTreeResponse = Endpoints["POST /repos/{owner}/{repo}/git/trees"]["response"]["data"];
type CreateCommitResponse = Endpoints["POST /repos/{owner}/{repo}/git/commits"]["response"]["data"];
type UpdateRefResponse = Endpoints["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]["response"]["data"];
type CreatePullRequestResponse = Endpoints["POST /repos/{owner}/{repo}/pulls"]["response"]["data"];
type MergePullRequestResponse = Endpoints["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"]["response"]["data"];

/**
 * Gets the specified branch reference.
 * 
 * @param params - The owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param branchName - The name of the branch.
 * @returns The response from the GitHub API.
 */
export const getBranch = async ({ owner, repository }: Repository, branchName: string): Promise<GetBranchResponse> => {
  const response = await octokit.request('GET /repos/{owner}/{repository}/git/ref/heads/{branchName}', {
    owner,
    repository,
    branchName
  });
  return response.data;
};

/**
 * Deletes the specified branch.
 * 
 * @param params - The owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param branchName - The name of the branch.
 * @returns The response from the GitHub API.
 */
export const deleteBranch = async ({ owner, repository }: Repository, branchName: string): Promise<DeleteBranchResponse> => {
  const response = await octokit.request('DELETE /repos/{owner}/{repository}/git/refs/heads/{branchName}', {
    owner,
    repository,
    branchName
  });

  return response.data;
};

/**
 * Gets the latest commit reference for the specified branch.
 * 
 * @param params - The owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param branchName - The name of the branch.
 * @returns The response from the GitHub API.
 */
export const getLatestCommit = async ({ owner, repository }: Repository, ref: string): Promise<GetLatestCommitResponse> => {
  const response = await octokit.request("GET /repos/{owner}/{repository}/git/ref/heads/{ref}", {
    owner,
    repository,
    ref
  });
  return response.data;
};

/**
 * Creates a new branch from the specified commit SHA.
 * 
 * @param params - The owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param branchName - The name of the branch.
 * @param sha - The commit SHA to create the branch from.
 * @returns The response from the GitHub API.
 */
export const createBranch = async ({ owner, repository }: Repository, branchName: string, sha: string): Promise<CreateBranchResponse> => {
  const response = await octokit.request("POST /repos/{owner}/{repository}/git/refs", {
    owner,
    repository,
    ref: `refs/heads/${branchName}`,
    sha
  });
  return response.data;
};

/**
 * Fetches the README file from the repositoryes develop branch.
 * 
 * @param params - The owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @returns The response from the GitHub API.
 */
export const fetchReadme = async ({ owner, repository }: Repository): Promise<FetchReadmeResponse> => {
  const response = await octokit.request("GET /repos/{owner}/{repository}/contents/{path}", {
    owner,
    repository,
    path: "README.md",
    ref: "develop"
  });
  return response.data;
};

/**
 * Creates a new blob with the specified content.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param content - The content of the blob to be created, encoded in base64.
 * @returns The response from the GitHub API.
 */
export const createBlob = async ({ owner, repository }: Repository, content: string): Promise<CreateBlobResponse> => {
  const response = await octokit.request("POST /repos/{owner}/{repository}/git/blobs", {
    owner,
    repository,
    content,
    encoding: "base64"
  });
  return response.data;
};

/**
 * Fetches the commit reference for the specified branch.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param ref - The branch reference.
 * @returns The response from the GitHub API.
 */
export const getCommitRef = async ({ owner, repository }: Repository, ref: string): Promise<GetCommitRefResponse> => {
  const response = await octokit.request("GET /repos/{owner}/{repository}/git/ref/{ref}", {
    owner,
    repository,
    ref: `heads/${ref}`
  });
  return response.data;
};

/**
 * Fetches the base tree for the specified commit SHA.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param tree_sha - The commit SHA.
 * @returns The response from the GitHub API.
 */
export const getBaseTree = async ({ owner, repository }: Repository, tree_sha: string): Promise<GetBaseTreeResponse> => {
  const response = await octokit.request("GET /repos/{owner}/{repository}/git/trees/{tree_sha}", {
    owner,
    repository,
    tree_sha
  });
  return response.data;
};

/**
 * Creates a new tree with the specified base tree, path, and SHA.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param base_tree - The base tree SHA.
 * @param path - The path for the new tree.
 * @param sha - The SHA for the new tree.
 * @returns The response from the GitHub API.
 */
export const createTree = async ({ owner, repository }: Repository, base_tree: string, sha: string): Promise<CreateTreeResponse> => {
  const response = await octokit.request("POST /repos/{owner}/{repository}/git/trees", {
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
  return response.data;
};

/**
 * Creates a new commit with the specified message, tree, and parents.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param message - The commit message.
 * @param tree - The tree SHA.
 * @param parents - The parent SHAs.
 * @returns The response from the GitHub API.
 */
export const createCommit = async ({ owner, repository }: Repository, message: string, tree: string, parents: string[]): Promise<CreateCommitResponse> => {
  const response = await octokit.request("POST /repos/{owner}/{repository}/git/commits", {
    owner,
    repository,
    message,
    tree,
    parents
  });
  return response.data;
};

/**
 * Updates the reference to point to the specified SHA.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param ref - The reference to update.
 * @param sha - The SHA to point the reference to.
 * @returns The response from the GitHub API.
 */
export const updateRef = async ({ owner, repository }: Repository, ref: string, sha: string): Promise<UpdateRefResponse> => {
  const response = await octokit.request("PATCH /repos/{owner}/{repository}/git/refs/{ref}", {
    owner,
    repository,
    ref: `heads/${ref}`,
    sha
  });
  return response.data;
};

/**
 * Creates a new pull request with the specified details.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param title - The title of the pull request.
 * @param head - The name of the branch where changes are implemented.
 * @param base - The name of the branch you want the changes pulled into.
 * @param body - The body text of the pull request.
 * @returns The response from the GitHub API.
 */
export const createPullRequest = async ({ owner, repository }: Repository, title: string, head: string, base: string, body: string): Promise<CreatePullRequestResponse> => {
  const response = await octokit.request("POST /repos/{owner}/{repository}/pulls", {
    owner,
    repository,
    title,
    head,
    base,
    body
  });
  return response.data;
};

/**
 * Merges the specified pull request.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @param pullNumber - The number of the pull request.
 * @returns The response from the GitHub API.
 */
export const mergePullRequest = async ({ owner, repository }: Repository, pullNumber: number): Promise<MergePullRequestResponse> => {
  const response = await octokit.request("PUT /repos/{owner}/{repository}/pulls/{pull_number}/merge", {
    owner,
    repository,
    pull_number: pullNumber,
    merge_method: "merge"
  });
  return response.data;
};

/**
 * Archives the specified repository.
 * 
 * @param params - An object containing the owner and repository name.
 * @param params.owner - The owner of the repository.
 * @param params.repository - The name of the repository.
 * @returns The response from the GitHub API.
 */
export const archiveRepository = async ({ owner, repository }: Repository): Promise<any> => {
  return await octokit.request("PATCH /repos/{owner}/{repository}", {
    owner,
    repository,
    archived: true,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};
