import * as core from '@actions/core'
import * as io from '@actions/io'
import {promises as fs} from 'fs'
import * as path from 'path'

/**
 * Helper function to clean up the workspace by removing all files and directories
 * This is useful for self-hosted runners where workspace state may persist between runs
 *
 * Note: This function uses cross-platform Node.js APIs and works on Linux/Unix/Windows runners.
 */
export async function cleanupWorkspace(): Promise<void> {
  const cwd = process.cwd()

  // List files before cleanup
  core.info('Files before cleanup:')
  try {
    const entries = await fs.readdir('./', {withFileTypes: true})
    const filteredEntries = entries.filter(
      entry => entry.name !== '.' && entry.name !== '..'
    )

    if (filteredEntries.length === 0) {
      core.info('  (empty)')
    } else {
      for (const entry of filteredEntries) {
        const type = entry.isDirectory() ? 'd' : entry.isFile() ? 'f' : '?'
        core.info(`  [${type}] ${entry.name}`)
      }
    }
  } catch (error) {
    core.warning(`Failed to list files before cleanup: ${error}`)
  }

  // Remove all files and directories (including hidden ones)
  core.info('Removing files...')
  try {
    const entries = await fs.readdir('./', {withFileTypes: true})
    const filteredEntries = entries.filter(
      entry => entry.name !== '.' && entry.name !== '..'
    )

    for (const entry of filteredEntries) {
      const entryPath = path.join(cwd, entry.name)
      try {
        await io.rmRF(entryPath)
        core.info(`  Removed: ${entry.name}`)
      } catch (error) {
        core.warning(`Failed to remove ${entry.name}: ${error}`)
        // Continue to next entry even if this one fails
      }
    }
  } catch (error) {
    core.warning(`Failed to enumerate files for removal: ${error}`)
  }

  // List files after cleanup
  core.info('Files after cleanup:')
  try {
    const entries = await fs.readdir('./', {withFileTypes: true})
    const filteredEntries = entries.filter(
      entry => entry.name !== '.' && entry.name !== '..'
    )

    if (filteredEntries.length === 0) {
      core.info('  (empty)')
    } else {
      for (const entry of filteredEntries) {
        const type = entry.isDirectory() ? 'd' : entry.isFile() ? 'f' : '?'
        core.info(`  [${type}] ${entry.name}`)
      }
    }
  } catch (error) {
    core.warning(`Failed to list files after cleanup: ${error}`)
  }
}
