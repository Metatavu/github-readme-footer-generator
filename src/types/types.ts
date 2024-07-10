export interface Repository {
  owner: string;
  repository: string;
}

export interface RepositoryStatus extends Repository {
  status: string;
  message: string;
}