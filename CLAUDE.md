# Checkout with Cleanup Action - Development Notes

## Overview

This is a fork of [actions/checkout](https://github.com/actions/checkout) with additional pre and post cleanup functionality. The goal is to provide a drop-in replacement that can optionally clean up the workspace before checkout and after job completion.

## Changes Made

### 1. Added Cleanup Input Parameters

Two new input parameters have been added to `action.yml`:

- `pre-cleanup` (default: `true`) - Enables cleanup of the workspace before checkout
- `post-cleanup` (default: `true`) - Enables cleanup of the workspace after job completion

### 2. Pre-Cleanup Functionality

The pre-cleanup step runs before the repository checkout and performs the following:

1. Lists all files in the workspace (including hidden files)
2. Removes all files and directories (except `.` and `..`)
3. Lists remaining files to verify cleanup

This ensures a clean workspace before checkout, which is useful when:
- Reusing self-hosted runners
- Preventing file conflicts from previous runs
- Ensuring consistent build environments

The cleanup functionality uses cross-platform Node.js APIs (`fs.promises`, `@actions/io`) and works on Linux/Unix/Windows runners.

### 3. Post-Cleanup Configuration

The existing post-cleanup functionality (which removes git credentials) can now be disabled via the `post-cleanup` input parameter.

## Implementation Details

### Modified Files

1. **action.yml** - Added `pre-cleanup` and `post-cleanup` input parameters
2. **src/input-helper.ts** - Added logic to read the new input parameters
3. **src/git-source-settings.ts** - Extended the settings interface to include cleanup flags
4. **src/state-helper.ts** - Added state management for cleanup configuration
5. **src/main.ts** - Implemented pre-cleanup logic before checkout
6. **src/cleanup-helper.ts** - Cross-platform cleanup implementation using Node.js APIs
7. **README.md** - Updated documentation with fork information and new parameters

### Design Decisions

- **Default to `true`**: Both cleanup options default to enabled for maximum cleanliness
- **Configurable**: Users can disable either cleanup step if needed for their workflow
- **Cross-platform**: Pre-cleanup uses Node.js APIs (`fs.promises`, `@actions/io`) for cross-platform compatibility
- **Error handling**: Cleanup operations are wrapped in try/catch blocks to continue even if some files can't be removed
- **State preservation**: Cleanup configuration is saved to state for the post-job phase

## Development Workflow

Before committing any changes, you must run the following commands:

```bash
# Format the code with prettier
npm run format

# Build the distribution bundle
npm run build
```

These commands ensure:
- Code is formatted consistently according to project standards
- The `dist/index.js` bundle is up-to-date with source changes
- The action will work correctly when deployed

**Important**: The `dist/` directory must be committed along with source changes, as GitHub Actions runs the bundled code from `dist/index.js`.

## Usage

```yaml
- uses: sitelevel/checkout-with-cleanup-action@v1
  with:
    # All standard checkout options work
    repository: my-org/my-repo
    ref: main

    # New cleanup options
    pre-cleanup: true   # Clean workspace before checkout (default: true)
    post-cleanup: true  # Clean credentials after job (default: true)
```

## Testing Recommendations

1. Test with self-hosted runners to verify cleanup effectiveness
2. Test with `pre-cleanup: false` to ensure it's properly skipped
3. Test with `post-cleanup: false` to ensure credentials persist when needed
4. Test in various workspace states (empty, dirty, with hidden files)
5. Test on Windows runners to verify cross-platform compatibility

## Maintenance Notes

- This fork should be kept in sync with upstream actions/checkout for security updates
- The cleanup logic is isolated to minimize merge conflicts
- All changes are backward compatible - existing workflows will work without modifications
