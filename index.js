import { config } from "dotenv";
import { getMockRepos, getOrganizationRepositories } from "./utils/githubOrganizationUtils.js";
import { displaySelectedRepositories, updateReadmeAndAutoMergeRepositories } from "./utils/githubUtils.js"

config();
const ORG = process.env.ORG;

// Define the custom footer (will be wrapped inside a custom div for identification)
const footer = `<div align="center">
    <h2>Example</h2>
</div>`;

async function main() {
    // const repositoriesOBJ = await getOrganizationRepositories(ORG);
    // displaySelectedRepositories(repositoriesOBJ)

    const repositoriesOBJ = await getMockRepos();
    displaySelectedRepositories(repositoriesOBJ)
    await updateReadmeAndAutoMergeRepositories(repositoriesOBJ, footer)
}


//entry point
main().catch(error => {
    console.error('Error in main function:', error);
});