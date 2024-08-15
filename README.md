# Github Readme Footer Generator

This script is used to generate custom footer component under public repositories of organization. The script can detect presence of
previously added footer components and user is prompted to either overwrite or skip these repositories, so the script SHOULD be safe to run multiple times.

Unexpected behavior may occur if the affected repository changes mid execution of the script.

## How to use
### Cloning Repository, Installing Dependencies, and Running Node.js Script

1. Clone the repository using the following command:
```
   git clone git@github.com:Metatavu/github-readme-footer-generator.git
```

2. Move to the cloned project file with command:
```
  cd github-readme-footer-generator
```

3. Set Node.js version
```
  nvm use
```

4. run npm install to get dependencies with command:
```
  npm install
```

5. run script with command:
```
  npm start
```

### .env's to configure
.env should have the following properties:

- *GITHUB_TOKEN = used for authorization
- *ORG = used for fetching all public repositories of said organization 
- *UPDATE_BRANCH_NAME = name for the to-be created updater branch where pull requests and merges are done from (should not be manually used branch) 
- OVERRIDE_REPOS = JSON array of repository objects as string, if set they will be used as the selected repositories instead. Format of: '[{"owner":"value1","repository":"value2"},...]'
  
\* = necessary 

### Token
The "GITHUB_TOKEN" should be fine grained github token with permissions to:
- Contents **Read and Write**
- Pull requests **Read and Write**
- Administration **Read and Write** (used for archiving)
  
to the repositories wanted to be updated.

### Custom footer to configure
To configure the custom footer that the script will insert into the processed repositories, edit the file located at:
```
  src/custom-footer.ts
```
Update this file with the desired HTML content for the footer.

## Scripts workflow

### 1. Initial settings
**Repository Selection:** The script will first prompt the user to decide whether to update all fetched repositories at once. If the user chooses 'y' (yes), the script will proceed without further confirmations. If the user chooses 'n' (no), the script will prompt the user individually for each repository, asking whether to update or skip it.

**Footer Overwrite Handling:** The script will then ask the user if they want to automatically overwrite custom footers found in the selected repositories. This setting only affects how the script handles existing footers in the selected repositories. If set to 'y' (yes), the script will overwrite any existing custom footers without further prompts. If set to 'n' (no), the script will prompt the user for confirmation each time a custom footer is found.

### 2. Branch Management:<br/>
The script ensures the update-readme branch is current by deleting it if it exists and recreating it from the latest develop branch.

### 3. README Update:<br/>
It checks each repository for a existing custom footer in the README file. If detected and not set to overwrite all, it prompts the user for confirmation.

### 4. Pull Request Creation:<br/>
If changes are made to the README (and differ from original), the script creates a pull request from the update-readme branch to develop.

### 5. Automated Merging:<br/>
Successful pull requests are automatically merged into the develop branch.

## Bugs
- Script will always create the readme updater branch regardless is it needed or pull request is created.
