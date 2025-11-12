import * as core from '@actions/core'
import * as coreCommand from '@actions/core/lib/command'
import * as gitSourceProvider from './git-source-provider'
import * as inputHelper from './input-helper'
import * as path from 'path'
import * as stateHelper from './state-helper'
import * as exec from '@actions/exec'
import * as io from '@actions/io'

async function run(): Promise<void> {
  try {
    const sourceSettings = await inputHelper.getInputs()

    // Save post-cleanup setting for the POST action
    stateHelper.setPostCleanup(sourceSettings.postCleanup)

    // Pre-cleanup: Remove all files from workspace before checkout
    if (sourceSettings.preCleanup) {
      core.info('Performing pre-checkout cleanup...')
      try {
        // List files before cleanup
        core.info('Files before cleanup:')
        await exec.exec('ls', ['-la', './'])

        // Remove all files and directories (including hidden ones)
        // Using || true to continue even if some files can't be removed
        await exec.exec('sh', [
          '-c',
          'rm -rf ./* || true; rm -rf ./.??* || true'
        ])

        // List files after cleanup
        core.info('Files after cleanup:')
        await exec.exec('ls', ['-la', './'])
      } catch (error) {
        core.warning(
          `Pre-cleanup failed: ${(error as any)?.message ?? error}`
        )
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
    // Only perform cleanup if post-cleanup is enabled
    if (stateHelper.PostCleanup) {
      core.info('Performing post-job cleanup...')
      await gitSourceProvider.cleanup(stateHelper.RepositoryPath)
    } else {
      core.info('Post-cleanup is disabled, skipping...')
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
