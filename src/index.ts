import chalk from "chalk";
import { config } from "./config";
import { getOrganizationPublicRepositories } from "./utils/github-organization-utils";
import { displaySelectedRepositories, updateReadmeAndAutoMergeRepositories as updateRepositoriesReadmesAndPullMerge } from "./utils/github-utils";
import { footer } from "./custom-footer";
import { isValidRepositories } from "./utils/utils";
import { Repository } from "./types/types";
import { promptAndLoadFailedRepositories } from "./utils/repository-error-file-utils";

const organization = config.ORG;
const overrideRepositories = config.OVERRIDE_REPOS;

/**
 * Main function that coordinates the script to update README files, create pull requests, and auto-merge them.
 * Handles override repositories if provided, loads repositories from file
 * or fetches all public repositories of the specified organization.
 * 
 */
const main = async():Promise<void> => {
  try {
    let repositoriesOBJ: Repository[];
    let loadedFromFile;

    // Can be used to set repositories manually or for testing. OVERRIDE_REPOS env should be JSON object as string: '[{"owner":"value1","repository":"value2"},...]'
    // Either uses overrideRepositories if set, loads from file if found and user accepts, or fetches organization's public repositories
    if (overrideRepositories && overrideRepositories.length !== 0) {
      repositoriesOBJ = overrideRepositories;
    } else if ((loadedFromFile = promptAndLoadFailedRepositories())) {
      repositoriesOBJ = loadedFromFile;
    } else {
      repositoriesOBJ = await getOrganizationPublicRepositories(organization);
    }

    if (!isValidRepositories(repositoriesOBJ)) {
      console.log(chalk.red("Empty or invalid array of repositories. Aborting..."));
      return;
    }

    displaySelectedRepositories(repositoriesOBJ);
    await updateRepositoriesReadmesAndPullMerge(repositoriesOBJ, footer);

  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Entry point
main();