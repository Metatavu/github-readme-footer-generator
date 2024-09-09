import fs from "fs";
import chalk from "chalk";
import prompt from "prompt-sync";
import { Repository, RepositoryStatus } from "../types/types";

const promptSync = prompt();

/**
 * Saves an array of failed repositories to a JSON file.
 *
 * @param failedRepositories - An array of repositories that failed.
 * @returns void
 */
export const saveFailedRepositoriesToFile = (failedRepositories: Repository[]): void => {
  const filePath = "failed-repositories.json";
  const jsonContent = JSON.stringify(failedRepositories, null, 2);

  fs.writeFileSync(filePath, jsonContent, "utf8");
  console.log(`Failed repositories have been saved to ${filePath}`);
};

/**
 * Prompts the user to save failed repositories to a file if there are any.
 *
 * @param repositoryStatuses - An array of repository statuses.
 * @returns void
 */
export const promptAndSaveFailedRepositories = (repositoryStatuses: RepositoryStatus[]): void => {
  const failedRepositories = repositoryStatuses
    .filter(repoStatus => repoStatus.status === "failed")
    .map(({ owner, repository }) => ({ owner, repository }));

  if (failedRepositories.length > 0) {
    console.log("")
    const saveToFileAnswer = promptSync(chalk.red(`There was ${failedRepositories.length} failed repositories. Do you want to save them to a file as JSON? (y/N): `));
    const saveToFile = saveToFileAnswer?.toLowerCase() === "y";
    if (saveToFile) {
      try {
        saveFailedRepositoriesToFile(failedRepositories);
        console.log(chalk.green("Saved to file"))
      } catch {
        console.log(chalk.red("Failed to save on file"))
      }

    }
  }
};

/**
 * Prompts the user to load failed repositories from a JSON file if the file exists.
 *
 * @returns An array of repositories if the file is loaded, otherwise null.
 */
export const promptAndLoadFailedRepositories = (): Repository[] | null => {
  const filePath = "failed-repositories.json";
  if (fs.existsSync(filePath)) {
    const loadAnswer = promptSync(chalk.red("Found failed-repositories.json Do you want to load the repositories to be used from this file? (y/N): "));
    if (loadAnswer.toLowerCase() === "y") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent);
    }
  }
  return null;
};