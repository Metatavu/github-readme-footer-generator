/**
 * Type describing repository with its owner and name.
 */
export interface Repository {
  owner: string;
  repository: string;
}

/**
 * Type that Extends the Repository interface to include status and message.
 */
export interface RepositoryStatus extends Repository {
  status: string;
  message: string;
}