/**
 * Encodes a string to Base64 format.
 * 
 * @param content - The string content to encode.
 * @returns The Base64 encoded string.
 */
export const encodeToBase64 = (content: string): string => {
  return Buffer.from(content).toString("base64");
};

/**
 * Decodes a Base64 encoded string.
 * 
 * @param base64Content - The Base64 encoded string to decode.
 * @returns The decoded string.
 */
export const decodeBase64Content = (base64Content: string): string => {
  return Buffer.from(base64Content, "base64").toString("utf-8");
};

/**
 * wraps a string in purple color.
 * 
 * @param text - The text to color.
 * @returns The text wrapped in purple color codes.
 */
export const logPurple = (text: string): string => {
  return `\x1b[35m${text}\x1b[0m`;
};

/**
 * wraps a string in cyan color.
 * 
 * @param text - The text to color.
 * @returns The text wrapped in cyan color codes.
 */
export const logCyan = (text: string): string => {
  return `\x1b[36m${text}\x1b[0m`;
};

/**
 * wraps a string in red color.
 * 
 * @param text - The text to color.
 * @returns The text wrapped in red color codes.
 */
export const logRed = (text: string): string => {
  return `\x1b[31m${text}\x1b[0m`;
};
