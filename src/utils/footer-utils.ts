import { parse } from "node-html-parser";
import { logPurple, logRed } from "./utils";
import prompt from "prompt-sync";
import { Repository } from "../types/types";

const promptSync = prompt();

/**
 * Checks if the README content already contains a custom footer.
 * 
 * @param content - The content of the README file.
 * @returns Whether a custom footer is present in the README content.
 */
export const checkForExistingFooter = (content: string): boolean => {
  const dom = parse(content);
  const existingFooter = dom.querySelector("#metatavu-custom-footer");
  return !!existingFooter;
};

/**
 * Handles the logic for determining if the existing footer should be overwritten.
 * 
 * @param repositoryOBJ - The object containing the owner and repository name.
 * @param originalContent - The original content of the README file.
 * @param overwriteExistingFooter - A flag indicating if the existing footer should be overwritten.
 * @returns A boolean indicating if the footer should be overwritten.
 */
export const shouldOverwriteFooter = (repositoriesOBJ: Repository, originalContent: string, overwriteExistingFooter: boolean): boolean => {
  const owner = repositoriesOBJ.owner;
  const repoName = repositoriesOBJ.repository;
  const hasCustomFooter = checkForExistingFooter(originalContent);

  if (!overwriteExistingFooter && hasCustomFooter) {
    const answer = promptSync(`metatavu-custom-footer exists already! ${logRed("Do you want to overwrite the existing footer for")} ${logPurple(`${owner}/${repoName}`)} (y/N): `);
    if (answer?.toLowerCase() !== "y") {
      console.log("User aborted", logPurple(`${owner}/${repoName}`));
      return false;
    }
  }

  return true;
};

/**
 * Create or overwrite the custom footer in the README content.
 * 
 * @param content - The original content of the README file.
 * @param footer - The new footer to add.
 * @param forceOverwrite - A flag indicating if the existing footer should be overwritten.
 * @param repoName - The name of the repository.
 * @returns The updated content with the new footer.
 */
export const createOrOverwriteFooter = (content: string, footer: string, forceOverwrite: boolean, repoName: string): string => {
  const dom = parse(content);
  const existingFooter = dom.querySelector("#metatavu-custom-footer");

  if (existingFooter && forceOverwrite) {
    existingFooter.remove();
    console.log("Repository:", logPurple(repoName), " README was overwritten.");
  } else if (!existingFooter) {
    console.log("Repository:", logPurple(repoName), " README was updated.");
  }

  // Wrapper used for detecting custom footer when ever the script is checking if footer already exists and do we want to overwrite it
  const footerWrapper = parse(`<div id="metatavu-custom-footer">${footer}</div>`);
  dom.appendChild(footerWrapper);

  return dom.toString();
};
