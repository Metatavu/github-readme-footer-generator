import { config } from "dotenv";
import prompt from "prompt-sync";
import {
  deleteBranch,
  getBranch,
  getLatestCommit,
  createBranch,
  fetchReadme,
  createBlob,
  getCommitRef,
  getBaseTree,
  createTree,
  createCommit,
  updateRef,
  createPullRequest,
  mergePullRequest
} from "../services/github-services";
import { encodeToBase64, decodeBase64Content, logRed, logCyan, logPurple, logGreen, logOrange } from "./utils";
import { createOrOverwriteFooter, shouldOverwriteFooter } from "./footer-utils";
import { Repository, RepositoryStatus } from "../types/types";

config();
const updateBranchName = process.env.UPDATE_BRANCH_NAME;
const promptSync = prompt();

const repositoryStatuses: RepositoryStatus[] = [];

/**
 * Deletes a branch in a repository if it exists otherwise logs that no branch was found.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param branchName - The name of the branch to delete.
 * @returns A Promise that resolves with void.
 * @throws Throws an error if there's an issue deleting the branch.
 */
const deleteBranchIfExists = async (repositoryOBJ: Repository, branchName: string): Promise<void> => {
  const repoName = repositoryOBJ.repository

  try {
    await getBranch(repositoryOBJ, branchName);
    await deleteBranch(repositoryOBJ, branchName);
    console.log("Deleted existing branch:", logCyan(branchName), "in repository:", logPurple(repoName));
  } catch (error: any) {
    if (error.status === 404) {
      console.log("Branch", logCyan(branchName), "does not exist in repository", logPurple(repoName), "Proceeding...");
    } else {
      console.error("Error deleting branch");
      throw new Error(error)
    }
  }
};

/**
 * Creates a new branch from the latest commit on the 'develop' branch.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param branchName - The name of the new branch to create.
 * @returns A Promise that resolves with an object indicating if 'develop' branch exists.
 */
const createBranchFromDevelop = async (repositoryOBJ: Repository, branchName: string): Promise<{ hasDevelop: boolean }> => {
  const repoName = repositoryOBJ.repository
  const hardCodedDevelopBranch = "develop"

  try {
    const latestCommit = await getLatestCommit(repositoryOBJ, hardCodedDevelopBranch);
    await createBranch(repositoryOBJ, branchName, latestCommit.data.object.sha);
    console.log("Created branch:", logCyan(branchName), "from the latest develop commit for repository:", logPurple(repoName));
    return { hasDevelop: true };
  } catch (error: any) {
    if (error.status === 404) {
      console.log("Develop branch not found in repository:", logPurple(repoName));
    } else {
      console.error("Error creating branch from develop in repository:", logPurple(repoName), "Error:", error);
    }
    return { hasDevelop: false };
  }
};

/**
 * Update the README file of a repository with a custom footer.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param branchName - The name of the branch to update.
 * @param footer - The custom footer to add or overwrite in the README.
 * @param overwriteExistingFooter - Whether to overwrite an existing footer.
 * @returns A promise resolving to an object indicating if the readme was updated.
 */
const updateReadme = async (repositoryOBJ: Repository, branchName: string, footer: string, overwriteExistingFooter: boolean): Promise<{ updated: boolean }> => {
  const repoName = repositoryOBJ.repository;

  var fetchedReadmeResponse;
  try {
    fetchedReadmeResponse = await fetchReadme(repositoryOBJ);
  } catch {
    console.error(logRed(`README was not found in repository: ${logPurple(repoName)}`))
  }

  const base64fetchedReadme = fetchedReadmeResponse.data as { content: string, sha: string };
  const originalReadmeContent = decodeBase64Content(base64fetchedReadme.content);

  if (!shouldOverwriteFooter(repositoryOBJ, originalReadmeContent, overwriteExistingFooter)) {
    return { updated: false };
  }
  const updatedContent = createOrOverwriteFooter(originalReadmeContent, footer, true, repoName);
  if (updatedContent === originalReadmeContent) {
    console.log("Repository:", logPurple(repoName), "original data matched update, nothing was changed.");
    return { updated: false };
  }

  const base64UpdatedContent = encodeToBase64(updatedContent);

  const updated = await createAndCommit(repositoryOBJ, branchName, base64UpdatedContent);
  return { updated };
};

/**
 * Create a new blob, tree, commit, and update the branch reference.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param branchName - The name of the branch to update.
 * @param base64UpdatedContent - The updated content encoded in base64.
 * @returns A boolean indicating if the update was successful.
 */
async function createAndCommit(repositoriesOBJ: Repository, branchName: string, base64UpdatedContent: string): Promise<boolean> {
  try {
    const blobResponse = await createBlob(repositoriesOBJ, base64UpdatedContent);
    const blobData = blobResponse.data as { sha: string };

    const latestCommitResponse = await getCommitRef(repositoriesOBJ, branchName);
    const latestCommit = latestCommitResponse.data as { object: { sha: string } };

    const baseTreeResponse = await getBaseTree(repositoriesOBJ, latestCommit.object.sha);
    const baseTree = baseTreeResponse.data as { sha: string };

    const newTreeResponse = await createTree(repositoriesOBJ, baseTree.sha, blobData.sha);
    const newTree = newTreeResponse.data as { sha: string };

    const newCommitResponse = await createCommit(repositoriesOBJ, "Update README", newTree.sha, [latestCommit.object.sha]);
    const newCommit = newCommitResponse.data as { sha: string };

    await updateRef(repositoriesOBJ, branchName, newCommit.sha);

    return true;
  } catch (error) {
    console.error("Error creating and updating:", error);
    return false;
  }
};

/**
 * Updates the README file of a repository, creates a branch, makes a pull request, and auto-merges it.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param footer - The footer content to be added or updated in the README.
 * @param overwriteExistingFooter - A boolean indicating whether to overwrite an existing custom footer.
 */
const updateReadmeAndAutoMerge = async (repositoryOBJ: Repository, footer: string, overwriteExistingFooter: boolean) => {
  const owner = repositoryOBJ.owner
  const updateBranch = updateBranchName || "update-readme";
  const repoName = repositoryOBJ.repository
  const hardCodedDevelopBranch = "develop"

  console.log("Beginning work on repository:", logPurple(repoName), "with branch of:", logCyan(updateBranch));
  try {
    await deleteBranchIfExists(repositoryOBJ, updateBranch);

    const { hasDevelop } = await createBranchFromDevelop(repositoryOBJ, updateBranch);
    if (!hasDevelop) {
      console.log(`No changes made to ${logPurple(`${repositoryOBJ.owner}/${repositoryOBJ.repository}`)}. Develop branch not found or latest commit information missing.`);
      repositoryStatuses.push({ ...repositoryOBJ, status: 'failed', message: 'Develop branch not found or latest commit information missing' });
      return;
    }

    const { updated } = await updateReadme(repositoryOBJ, updateBranch, footer, overwriteExistingFooter);
    if (!updated) {
      console.log("No changes made to", logPurple(`${owner}/${repoName}`), "skipping pull request creation.");
      repositoryStatuses.push({ ...repositoryOBJ, status: 'skipped', message: 'No changes needed' });
      return;
    }

    const pullRequestResponse = await createPullRequest(repositoryOBJ, "Update README via script", updateBranch, hardCodedDevelopBranch, "This PR updates the README.");
    const pullRequest = pullRequestResponse.data as { number: number };
    console.log("Pull request created with number:", pullRequest.number);

    await mergePullRequest(repositoryOBJ, pullRequest.number);
    console.log("Pull request:", pullRequest.number, "was auto merged");

    repositoryStatuses.push({ ...repositoryOBJ, status: 'successful', message: 'Changes were successful' });
  } catch (error: any) {
    repositoryStatuses.push({ ...repositoryOBJ, status: 'failed', message: 'Error in updating repository' });
  }
};

/**
 * Updates the README and auto merges for all specified repositories.
 * 
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param footer - The footer content to add or update in the README.
 */
export const updateReadmeAndAutoMergeRepositories = async (repositoriesOBJ: Repository[], footer: string) => {
  console.log("This script will add custom footers to ALL the specified repositories. It can also overwrite existing footers if desired.");
  console.log(logRed("If you do not want to automatically update ALL of the repositories selected, YOU MUST select 'n' in the following prompt."));
  const processAllAnswer = promptSync(logRed("Do you want to add custom footer to ALL found repositories? (otherwise will be asked individually) (y/N): "));
  const processAll = processAllAnswer?.toLowerCase() === "y";

  if (processAll) {
    console.log("All repositories will be processed.");
  }

  const overwriteAnswer = promptSync(logRed("If found do you want to automatically overwrite ALL existing metatavu-custom-footers (otherwise will be asked individually) (y/N): "));
  const overwriteAll = overwriteAnswer?.toLowerCase() === "y";
  if (overwriteAll) {
    console.log("All metatavu-custom-footers will be overwritten.");
  }

  for (let i = 0; i < repositoriesOBJ.length; i++) {
    const repositoryOBJ = repositoriesOBJ[i];
    console.log("\n", i);

    if (!processAll) {
      const perRepoAnswer = promptSync(logRed(`Do you want to process repository: ${logPurple(repositoryOBJ.repository)}? (y/N): `));
      if (perRepoAnswer?.toLowerCase() !== "y") {
        repositoryStatuses.push({ ...repositoryOBJ, status: 'skipped', message: 'Changes were skipped by user' });
        console.log(`Skipping repository ${logPurple(repositoryOBJ.repository)}.`);
        continue;
      }
    }

    await updateReadmeAndAutoMerge(repositoryOBJ, footer, overwriteAll);
  }

  displaySummary(repositoryStatuses);
};

/**
 * Displays a list of selected repositories in the console.
 *
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 */
export const displaySelectedRepositories = (repositoriesOBJ: Repository[]) => {
  console.log("---------Selected Repositories---------");
  for (let i = 0; i < repositoriesOBJ.length; i++) {
    const repo = repositoriesOBJ[i];
    console.log(i, ": ", "Owner:", repo.owner, "Repository:", logPurple(repo.repository));
  }
  console.log("---------------------------------------");
}

/**
 * Displays a summary of repository statuses in the console.
 *
 * @param repositoryStatuses - An array of objects representing repository statuses including owner, repository, status, and message.
 */
const displaySummary = (repositoryStatuses: { owner: string; repository: string; status: string; message: string }[]) => {
  console.log("\nSummary:");
  repositoryStatuses.forEach(repoStatus => {
    switch (repoStatus.status) {
      case 'skipped':
        console.log(`- ${logPurple(`${repoStatus.owner}/${repoStatus.repository}`)} - ${logOrange(repoStatus.status)} - ${repoStatus.message}`);
        break;
      case 'successful':
        console.log(`- ${logPurple(`${repoStatus.owner}/${repoStatus.repository}`)} - ${logGreen(repoStatus.status)} - ${repoStatus.message}`);
        break;
      case 'failed':
        console.log(`- ${logPurple(`${repoStatus.owner}/${repoStatus.repository}`)} - ${logRed(repoStatus.status)} - ${repoStatus.message}`);
        break;
      default:
        console.log(`- ${logPurple(`${repoStatus.owner}/${repoStatus.repository}`)} - ${repoStatus.message}`);
    }
  });
};