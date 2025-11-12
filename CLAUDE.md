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

```bash
# List current files
ls -la ./

# Remove all files (including hidden ones)
rm -rf ./* || true
rm -rf ./.??* || true

# Verify cleanup
ls -la ./
```

This ensures a clean workspace before checkout, which is useful when:
- Reusing self-hosted runners
- Preventing file conflicts from previous runs
- Ensuring consistent build environments

### 3. Post-Cleanup Configuration

The existing post-cleanup functionality (which removes git credentials) can now be disabled via the `post-cleanup` input parameter.

## Implementation Details

### Modified Files

1. **action.yml** - Added `pre-cleanup` and `post-cleanup` input parameters
2. **src/input-helper.ts** - Added logic to read the new input parameters
3. **src/git-source-settings.ts** - Extended the settings interface to include cleanup flags
4. **src/state-helper.ts** - Added state management for cleanup configuration
5. **src/main.ts** - Implemented pre-cleanup logic before checkout
6. **README.md** - Updated documentation with fork information and new parameters

### Design Decisions

- **Default to `true`**: Both cleanup options default to enabled for maximum cleanliness
- **Configurable**: Users can disable either cleanup step if needed for their workflow
- **Shell commands**: Pre-cleanup uses shell commands for maximum compatibility
- **Error handling**: Cleanup commands use `|| true` to continue even if some files can't be removed
- **State preservation**: Cleanup configuration is saved to state for the post-job phase

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

## Maintenance Notes

- This fork should be kept in sync with upstream actions/checkout for security updates
- The cleanup logic is isolated to minimize merge conflicts
- All changes are backward compatible - existing workflows will work without modifications
