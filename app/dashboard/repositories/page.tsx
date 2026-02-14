import { RepositoriesListGraphQL } from '@/components/graphql/repositories-list-gql';

export default function RepositoriesGraphQLPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Repositories (GraphQL)</h2>
        <p className="text-gray-500">Powered by Apollo Client and GraphQL</p>
      </div>

      <RepositoriesListGraphQL />
    </div>
  );
}
