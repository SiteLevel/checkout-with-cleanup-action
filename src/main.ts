import * as core from '@actions/core'
import * as coreCommand from '@actions/core/lib/command'
import * as gitSourceProvider from './git-source-provider'
import * as inputHelper from './input-helper'
import * as path from 'path'
import * as stateHelper from './state-helper'
import {cleanupWorkspace} from './cleanup-helper'

async function run(): Promise<void> {
  try {
    const sourceSettings = await inputHelper.getInputs()

    // Save post-cleanup setting for the POST action
    stateHelper.setPostCleanup(sourceSettings.postCleanup)

    // Pre-cleanup: Remove all files from workspace before checkout
    if (sourceSettings.preCleanup) {
      core.info('Performing pre-checkout cleanup...')
      try {
        await cleanupWorkspace()
      } catch (error) {
        core.warning(`Pre-cleanup failed: ${(error as any)?.message ?? error}`)
      }
    }

    try {
      // Register problem matcher
      coreCommand.issueCommand(
        'add-matcher',
        {},
        path.join(__dirname, 'problem-matcher.json')
      )

      // Get sources
      await gitSourceProvider.getSource(sourceSettings)
      core.setOutput('ref', sourceSettings.ref)
    } finally {
      // Unregister problem matcher
      coreCommand.issueCommand('remove-matcher', {owner: 'checkout-git'}, '')
    }
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`)
  }
}

async function cleanup(): Promise<void> {
  try {
    // Always perform the standard git cleanup (remove credentials, etc.)
    await gitSourceProvider.cleanup(stateHelper.RepositoryPath)

    // Additionally perform workspace cleanup if post-cleanup is enabled
    if (stateHelper.PostCleanup) {
      core.info('Performing additional post-job workspace cleanup...')
      try {
        await cleanupWorkspace()
      } catch (error) {
        core.warning(
          `Post-workspace-cleanup failed: ${(error as any)?.message ?? error}`
        )
      }
    }
  } catch (error) {
    core.warning(`${(error as any)?.message ?? error}`)
  }
}

// Main
if (!stateHelper.IsPost) {
  run()
}
// Post
else {
  cleanup()
}
