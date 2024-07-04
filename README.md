## Github Readme Footer Generator

This script is used to generate custom footer component under public repositories of organization. The script can detect presense of previosly added footer components and user is promted to either overwrite or skip these repositories, so the script SHOULD be safe to run multiple times.

Unexpected behavior may occur if the affected repository changes mid execution of the script.

## How to use

.env file should be created with "GITHUB_TOKEN" that is fine grained github token with permissions to:

- Contents **Read and Write**
- Pull requests **Read and Write**

to the repositories wanted to be updated.

--- 
Cloning Repository, Installing Dependencies, and Running Node.js Script

1. Clone the repository using the following command:
```
   git clone git@github.com:Metatavu/github-readme-footer-generator.git
```

2. Move to the cloned project file with command:
```
  cd github-readme-footer-generator
```

3. run npm install to get dependencies with command:
```
  npm install
```

4. run script with command:
```
node index.js
```

## Scripts workflow

1. Branch Management:<br/>
The script ensures the update-readme branch is current by deleting it if it exists and recreating it from the latest develop branch.

2. README Update:<br/>
It checks each repository for a existing custom footer in the README file. If detected and not set to overwrite all, it prompts the user for confirmation.

3. Pull Request Creation:<br/>
If changes are made to the README (and differ from original), the script creates a pull request from the update-readme branch to develop.

4. Automated Merging:<br/>
Successful pull requests are automatically merged into the develop branch.

## Bugs
- Script will always create the update-readme repository regardless is it needed or pull request created.
