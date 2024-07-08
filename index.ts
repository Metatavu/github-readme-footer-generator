import { config } from "dotenv";
import { getOrganizationRepositories } from "./utils/githubOrganizationUtils";
import { displaySelectedRepositories, updateReadmeAndAutoMergeRepositories as updateRepositoriesReadmesAndPullMerge } from "./utils/githubUtils";
import { footer } from "./customFooter";
import { logRed } from "./utils/utils";

config();
const TOKEN: string | undefined = process.env.GITHUB_TOKEN;
const organization: string | undefined = process.env.ORG;
const updateBranchName: string | undefined = process.env.UPDATE_BRANCH_NAME;
const overideRepositoriesJSON = process.env.OVERRIDE_REPOS;

async function main(): Promise<void> {
  if (!TOKEN) {
    console.error(logRed("GitHub token is not defined. Please set the GITHUB_TOKEN environment variable."));
    return;
  }
  if (!organization) {
    console.error(logRed("Organization name is not defined. Please set the ORG environment variable."));
    return;
  }
  if (!updateBranchName) {
    console.error(logRed("Name for Updater branch that is used to make pullrequest from is not defined (Should not be important or manually used branch, it will get deleted and re-created). Please set the updateBranchName environment variable."));
    return;
  }
  if (overideRepositoriesJSON) {
    console.log(logRed("Override repositories are set in the env and they will be used. \n"));
  }

  //Can be used to set repositories manually or for testing. OVERRIDE_REPOS env should be JSON object as string: '[{"owner":"value1","repository":"value2"},...]'
  //Either use env overideRepositories if set or fetch organizations all public repositories
  if (overideRepositoriesJSON) {
    const overrideRepositoriesOBJ = JSON.parse(overideRepositoriesJSON);
    displaySelectedRepositories(overrideRepositoriesOBJ);
    await updateRepositoriesReadmesAndPullMerge(overrideRepositoriesOBJ, footer);
    return;
  }

  // Fetch organizations all public repositories
  const repositoriesOBJ = await getOrganizationRepositories(organization);
  displaySelectedRepositories(repositoriesOBJ);
  await updateRepositoriesReadmesAndPullMerge(repositoriesOBJ, footer);
};

// Entry point
main().catch(error => {
  console.error("Error in main function:", error);
});
