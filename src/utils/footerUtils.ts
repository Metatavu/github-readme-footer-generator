import { parse } from "node-html-parser";
import { logPurple, logRed } from "./utils";
import prompt from "prompt-sync";

const promptSync = prompt();

/**
 * Check if the README content already contains a custom footer.
 * @param content - The content of the README file.
 * @returns A boolean indicating if a custom footer is present.
 */
export const checkForExistingFooter = (content: string): boolean => {
  const dom = parse(content);
  const existingFooter = dom.querySelector("#metatavu-custom-footer");
  return !!existingFooter;
};

/**
 * Handle the logic for determining if the existing footer should be overwritten.
 * @param originalContent - The original content of the README file.
 * @param overwriteExistingFooter - A flag indicating if the existing footer should be overwritten.
 * @param owner - The owner of the repository.
 * @param repoName - The name of the repository.
 * @returns A boolean indicating if the footer should be overwritten.
 */
export const shouldOverwriteFooter = (originalContent: string, overwriteExistingFooter: boolean, owner: string, repoName: string): boolean => {
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
 * @param content - The original content of the README file.
 * @param footer - The new footer to add.
 * @param forceOverwrite - A flag indicating if the existing footer should be forcibly overwritten.
 * @param repo - The name of the repository.
 * @returns The updated content with the new footer.
 */
export const createOrOverwriteFooter = (
  content: string,
  footer: string,
  forceOverwrite: boolean,
  repo: string
): string => {
  const dom = parse(content);
  const existingFooter = dom.querySelector("#metatavu-custom-footer");

  if (existingFooter && forceOverwrite) {
    console.log("Repository:", logPurple(repo), " README was overwritten.");
    existingFooter.remove();
  } else if (!existingFooter) {
    console.log("Repository:", logPurple(repo), " README was updated.");
  }

  // Wrapper used for detecting custom footer when ever the script is checking if footer already exists and do we want to overwrite it
  const footerWrapper = parse(`<div id="metatavu-custom-footer">${footer}</div>`);
  dom.appendChild(footerWrapper);

  return dom.toString();
};
