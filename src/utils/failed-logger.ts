import fs from 'fs';
import prompt from "prompt-sync";
import { Repository, RepositoryStatus } from '../types/types';
import { logGreen, logRed } from './utils';

const promptSync = prompt();

export const saveFailedRepositoriesToFile = (failedRepositories: Repository[]): void => {
  const filePath = 'failed-repositories.json';
  const jsonContent = JSON.stringify(failedRepositories, null, 2);

  fs.writeFileSync(filePath, jsonContent, 'utf8');
  console.log(`Failed repositories have been saved to ${filePath}`);
};

export const promptAndSaveFailedRepositories = (repositoryStatuses: RepositoryStatus[]): void => {
  const failedRepositories = repositoryStatuses
    .filter(repoStatus => repoStatus.status === 'failed')
    .map(({ owner, repository }) => ({ owner, repository }));

  if (failedRepositories.length > 0) {
    console.log("")
    const saveToFileAnswer = promptSync(logRed(`There was ${failedRepositories.length} failed repositories. Do you want to save them to a file as JSON? (y/N): `));
    const saveToFile = saveToFileAnswer?.toLowerCase() === "y";
    if (saveToFile) {
      try{
        saveFailedRepositoriesToFile(failedRepositories);
        console.log(logGreen("Saved to file"))
      }catch{
        console.log(logRed("Failed to save on file"))
      }
      
    }
  }
};