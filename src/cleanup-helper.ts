import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Helper function to clean up the workspace by removing all files and directories
 * This is useful for self-hosted runners where workspace state may persist between runs
 *
 * Note: This function uses Unix shell commands (sh, rm) and is intended for Linux/Unix-based runners.
 * It may not work as expected on Windows runners.
 */
export async function cleanupWorkspace(): Promise<void> {
  // List files before cleanup
  core.info('Files before cleanup:')
  await exec.exec('ls', ['-la', './'])

  // Remove all files and directories (including hidden ones)
  // Using || true to continue even if some files can't be removed
  await exec.exec('sh', ['-c', 'rm -rf ./* || true; rm -rf ./.??* || true'])

  // List files after cleanup
  core.info('Files after cleanup:')
  await exec.exec('ls', ['-la', './'])
}
