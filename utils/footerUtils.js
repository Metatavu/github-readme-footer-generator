import { parse } from 'node-html-parser'

export function checkForExistingFooter(content) {
    const dom = parse(content);
    const existingFooter = dom.querySelector('#metatavu-custom-footer');

    // Return true if footer exists, false otherwise
    return !!existingFooter;
}

export function createOrOverwriteFooter(content, footer, forceOverwrite, repo) {
    const dom = parse(content);
    const existingFooter = dom.querySelector('#metatavu-custom-footer');

    // if we have existing footer and and want to overwrite 
    if (existingFooter && forceOverwrite) {
        console.log("Repository:", repo.toString(), " README was overwriten.")
        dom.removeChild(existingFooter)
    } else {
        console.log("Repository:", repo.toString(), " README was updated.")
    }

    // Wrapper used detecting custom footer
    const footerWrapper = parse(`<div id="metatavu-custom-footer">${footer}</div>`);
    dom.appendChild(footerWrapper);

    return dom.toString();
}