export function encodeToBase64(content) {
    return Buffer.from(content).toString('base64');
}

export function decodeBase64Content(base64Content) {
    return Buffer.from(base64Content, 'base64').toString('utf-8');
}