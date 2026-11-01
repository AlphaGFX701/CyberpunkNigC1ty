// Keep the CLI entry separate from the API bundle. The implementation only applies
// this game's fixed migration; it never changes provider-managed auth tables.
import '../server/migrate.ts'
