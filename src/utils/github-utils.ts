import chalk from "chalk";
import { config } from "../config";
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
  mergePullRequest,
  archiveRepository
} from "../services/github-services";
import { encodeToBase64, decodeBase64Content } from "./utils";
import { createOrOverwriteFooter, shouldOverwriteFooter } from "./footer-utils";
import { Repository, RepositoryStatus } from "../types/types";
import { promptAndSaveFailedRepositories } from "./repository-error-file-utils";

const updateBranchName = config.UPDATE_BRANCH_NAME;
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
const deleteBranchIfExists = async (repositoryOBJ: Repository, branchName: string) => {
  const repoName = repositoryOBJ.repository;

  const branchExists = await isExistingBranch(repositoryOBJ, branchName)
  if (!branchExists) {
    console.log("Branch", chalk.cyan(branchName), "does not exist in repository", chalk.magenta(repoName), "Proceeding...");
    return;
  }

  try { 
    await deleteBranch(repositoryOBJ, branchName);
    console.log("Deleted existing branch:", chalk.cyan(branchName), "in repository:", chalk.magenta(repoName));
  } catch (error: any) {
    console.error("Error deleting branch");
    throw new Error(error);
  }
};

/**
 * Checks if a branch exists in the given repository.
 *
 * @param repositoryOBJ - An object containing the owner and repository name.
 * @param repositoryOBJ.owner - The owner of the repository.
 * @param repositoryOBJ.repository - The name of the repository.
 * @param branchName - The name of the branch to check for existence.
 * @returns A Promise that resolves to `true` if the branch exists, `false` if it does not exist.
 * @throws Throws an error if there is an issue other than the branch not being found.
 */
const isExistingBranch = async (repositoryOBJ: Repository, branchName: string): Promise<boolean> => {
  try {
    await getBranch(repositoryOBJ, branchName);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    } else {
      console.error(error)
      throw new Error(error);
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
const createBranchFromDevelop = async (repositoryOBJ: Repository, branchName: string) => {
  const repoName = repositoryOBJ.repository
  const hardCodedDevelopBranch = "develop"

  try {
    const latestCommit = await getLatestCommit(repositoryOBJ, hardCodedDevelopBranch);
    await createBranch(repositoryOBJ, branchName, latestCommit.object.sha);
    console.log("Created branch:", chalk.cyan(branchName), "from the latest develop commit for repository:", chalk.magenta(repoName));
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      console.log("Develop branch not found in repository:", chalk.magenta(repoName));
    } else {
      console.error("Error creating branch from develop in repository:", chalk.magenta(repoName), "Error:", error);
    }
    return false;
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
const updateReadme = async (repositoryOBJ: Repository, branchName: string, footer: string, overwriteExistingFooter: boolean) => {
  const repoName = repositoryOBJ.repository;

  var fetchedReadmeResponse;
  try {
    fetchedReadmeResponse = await fetchReadme(repositoryOBJ);
  } catch {
    console.error(chalk.red(`README was not found in repository: ${chalk.magenta(repoName)}`))
  }

  const base64fetchedReadme = fetchedReadmeResponse as { content: string, sha: string };
  const originalReadmeContent = decodeBase64Content(base64fetchedReadme.content);

  if (!shouldOverwriteFooter(repositoryOBJ, originalReadmeContent, overwriteExistingFooter)) {
    return false;
  }
  const updatedContent = createOrOverwriteFooter(originalReadmeContent, footer, true, repoName);
  if (updatedContent === originalReadmeContent) {
    console.log("Repository:", chalk.magenta(repoName), "original data matched update, nothing was changed.");
    return false;
  }

  const base64UpdatedContent = encodeToBase64(updatedContent);

  const updated = await createAndCommit(repositoryOBJ, branchName, base64UpdatedContent);
  return updated;
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
const createAndCommit = async (repositoriesOBJ: Repository, branchName: string, base64UpdatedContent: string): Promise<boolean> => {
  try {
    const blobResponse = await createBlob(repositoriesOBJ, base64UpdatedContent);
    const blobDataSHA = blobResponse.sha;

    const latestCommitResponse = await getCommitRef(repositoriesOBJ, branchName);
    const latestCommitSHA = latestCommitResponse.object.sha;

    const baseTreeResponse = await getBaseTree(repositoriesOBJ, latestCommitSHA);
    const baseTreeSHA = baseTreeResponse.sha;

    const newTreeResponse = await createTree(repositoriesOBJ, baseTreeSHA, blobDataSHA);
    const newTreeSHA = newTreeResponse.sha;

    const newCommitResponse = await createCommit(repositoriesOBJ, "Update README", newTreeSHA, [latestCommitSHA]);
    const newCommitSHA = newCommitResponse.sha;

    await updateRef(repositoriesOBJ, branchName, newCommitSHA);

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

  console.log("Beginning work on repository:", chalk.magenta(repoName), "with branch of:", chalk.cyan(updateBranch));
  try {
    await deleteBranchIfExists(repositoryOBJ, updateBranch);

    const hasDevelop = await createBranchFromDevelop(repositoryOBJ, updateBranch);
    if (!hasDevelop) {
      console.log(`No changes made to ${chalk.magenta(`${repositoryOBJ.owner}/${repositoryOBJ.repository}`)}. Develop branch not found or latest commit information missing.`);
      repositoryStatuses.push({ ...repositoryOBJ, status: "failed", message: "Develop branch not found or latest commit information missing" });
      return;
    }

    const updated = await updateReadme(repositoryOBJ, updateBranch, footer, overwriteExistingFooter);
    if (!updated) {
      console.log("No changes made to", chalk.magenta(`${owner}/${repoName}`), "skipping pull request creation.");
      repositoryStatuses.push({ ...repositoryOBJ, status: "skipped", message: "No changes needed" });
      return;
    }

    const pullRequestResponse = await createPullRequest(repositoryOBJ, "Update README via script", updateBranch, hardCodedDevelopBranch, "This PR updates the README.");
    const pullRequestNumber = pullRequestResponse.number;
    console.log("Pull request created with number:", pullRequestNumber);

    await mergePullRequest(repositoryOBJ, pullRequestNumber);
    console.log("Pull request:", pullRequestNumber, "was auto merged");

    repositoryStatuses.push({ ...repositoryOBJ, status: "successful", message: "Changes were successful" });
  } catch (error: any) {
    repositoryStatuses.push({ ...repositoryOBJ, status: "failed", message: "Error in updating repository" });
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
  console.log(chalk.red("If you do not want to automatically update ALL of the repositories selected, YOU MUST select 'n' in the following prompt."));
  const processAllAnswer = promptSync(chalk.red("Do you want to add custom footer to ALL found repositories? (otherwise will be asked individually) (y/N): "));
  const processAll = processAllAnswer?.toLowerCase() === "y";

  if (processAll) {
    console.log("All repositories will be processed.");
  }

  const overwriteAnswer = promptSync(chalk.red("If found do you want to automatically overwrite ALL existing metatavu-custom-footers (otherwise will be asked individually) (y/N): "));
  const overwriteAll = overwriteAnswer?.toLowerCase() === "y";
  if (overwriteAll) {
    console.log("All metatavu-custom-footers will be overwritten.");
  }

  for (let i = 0; i < repositoriesOBJ.length; i++) {
    const repositoryOBJ = repositoriesOBJ[i];
    console.log("\n", i);

    if (!processAll) {
      const perRepoAnswer = promptSync(chalk.red(`Do you want to process or archive repository: ${chalk.magenta(repositoryOBJ.repository)}? (y/N/archive): `));
      if (perRepoAnswer?.toLowerCase() === "archive") {
        try {
          await archiveRepository(repositoryOBJ);
          repositoryStatuses.push({ ...repositoryOBJ, status: "archived", message: "Repository was archived by user" });
          console.log(`Repository ${chalk.magenta(repositoryOBJ.repository)} was archived. Proceeding...`);
        } catch (error) {
          console.error(`Error archiving repository ${repositoryOBJ.repository}:`, error);
          repositoryStatuses.push({ ...repositoryOBJ, status: "failed", message: "Failed to archive repository" });
        }
        continue;
      }
      else if (perRepoAnswer?.toLowerCase() !== "y") {
        repositoryStatuses.push({ ...repositoryOBJ, status: "skipped", message: "Changes were skipped by user" });
        console.log(`Skipping repository ${chalk.magenta(repositoryOBJ.repository)}.`);
        continue;
      }
    }

    await updateReadmeAndAutoMerge(repositoryOBJ, footer, overwriteAll);
  }

  displaySummary(repositoryStatuses);
  promptAndSaveFailedRepositories(repositoryStatuses);
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
    console.log(i, ": ", "Owner:", repo.owner, "Repository:", chalk.magenta(repo.repository));
  }
  console.log("---------------------------------------");
}

/**
 * Displays a summary of repository statuses in the console.
 *
 * @param repositoryStatuses - An array of objects representing repository statuses including owner, repository, status, and message.
 */
const displaySummary = (repositoryStatuses:RepositoryStatus[]) => {
  console.log("\nSummary:");
  repositoryStatuses.forEach(repoStatus => {
    switch (repoStatus.status) {
      case "skipped":
        console.log(`- ${chalk.magenta(`${repoStatus.owner}/${repoStatus.repository}`)} - ${chalk.ansi256(214)(repoStatus.status)} - ${repoStatus.message}`);
        break;
      case "successful":
        console.log(`- ${chalk.magenta(`${repoStatus.owner}/${repoStatus.repository}`)} - ${chalk.green(repoStatus.status)} - ${repoStatus.message}`);
        break;
      case "failed":
        console.log(`- ${chalk.magenta(`${repoStatus.owner}/${repoStatus.repository}`)} - ${chalk.red(repoStatus.status)} - ${repoStatus.message}`);
        break;
      default:
        console.log(`- ${chalk.magenta(`${repoStatus.owner}/${repoStatus.repository}`)} - ${repoStatus.status} - ${repoStatus.message}`);
    }
  });
};