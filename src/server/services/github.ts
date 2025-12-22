import { Octokit } from "octokit";

export class GitHubService {
    private client: Octokit;

    constructor(token: string) {
        this.client = new Octokit({ auth: token });
    }

    /**
     * List repositories for the authenticated user
     */
    async listRepositories() {
        const { data } = await this.client.rest.repos.listForAuthenticatedUser({
            sort: "updated",
            per_page: 100,
            visibility: "all", // "all" | "public" | "private"
        });
        return data;
    }

    /**
     * Get details of a specific repository
     */
    async getRepository(owner: string, repo: string) {
        const { data } = await this.client.rest.repos.get({ owner, repo });
        return data;
    }

    /**
     * Get raw content of a file
     */
    async getFileContent(owner: string, repo: string, path: string) {
        try {
            const { data } = await this.client.rest.repos.getContent({
                owner,
                repo,
                path,
                mediaType: {
                    format: "raw",
                },
            });
            // If we request raw, data is string
            return data as unknown as string;
        } catch (error) {
            console.error(`Error fetching file ${path}:`, error);
            throw error;
        }
    }

    /**
     * Get recursive file tree
     */
    async getFileTree(owner: string, repo: string, branch?: string) {
        // If branch not provided, get default branch
        let sha = branch;
        if (!sha) {
            const repoData = await this.getRepository(owner, repo);
            sha = repoData.default_branch;
        }

        // Get the tree SHA from the branch reference
        // Actually getRepository gives us default_branch name. We need the commit SHA or just pass branch name to getTree?
        // git.getTree requires tree_sha. We can get it from heads/branch.

        // Optimization: getRef is needed
        try {
            const { data: refData } = await this.client.rest.git.getRef({
                owner,
                repo,
                ref: `heads/${sha}`,
            });
            const treeSha = refData.object.sha;

            const { data } = await this.client.rest.git.getTree({
                owner,
                repo,
                tree_sha: treeSha,
                recursive: "true",
            });

            // Filter out blobs (files) only, ignore node_modules, etc.
            return data.tree.filter(item =>
                item.type === "blob" &&
                !item.path?.includes("node_modules") &&
                !item.path?.includes(".git/") &&
                !item.path?.includes("package-lock.json") &&
                !item.path?.includes("yarn.lock") &&
                !item.path?.endsWith(".png") &&
                !item.path?.endsWith(".jpg")
            );
        } catch (e) {
            console.error("Error fetching tree:", e);
            throw e;
        }
    }
}
