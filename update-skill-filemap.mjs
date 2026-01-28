#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MARKER_BEGIN = '<!-- FILEMAP:BEGIN -->'
const MARKER_END = '<!-- FILEMAP:END -->'

const IGNORED_DIRS = new Set(['node_modules', '.git', '.DS_Store'])
const IGNORED_FILES = new Set(['.DS_Store'])

function listSkillDirs(skillsRoot) {
  const entries = readdirSync(skillsRoot, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(skillsRoot, e.name))
    .filter((dir) => {
      try {
        return statSync(path.join(dir, 'SKILL.md')).isFile()
      } catch {
        return false
      }
    })
    .sort()
}

function walkDir(skillRoot, relDir = '.', out = new Map()) {
  const absDir = relDir === '.' ? skillRoot : path.join(skillRoot, relDir)
  let entries
  try {
    entries = readdirSync(absDir, { withFileTypes: true })
  } catch {
    return out
  }

  const files = []
  const dirs = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      dirs.push(entry.name)
      continue
    }
    if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue
      files.push(entry.name)
      continue
    }
  }

  files.sort((a, b) => a.localeCompare(b))
  dirs.sort((a, b) => a.localeCompare(b))

  if (files.length > 0) {
    out.set(relDir, files)
  }

  for (const d of dirs) {
    const nextRel = relDir === '.' ? d : path.join(relDir, d)
    walkDir(skillRoot, nextRel, out)
  }

  return out
}

function formatFileMap({ skillName, map }) {
  const lines = [`[${skillName} file map]|root: .`]
  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b))

  for (const dir of keys) {
    const files = map.get(dir) || []
    const label = dir === '.' ? '.' : dir.replaceAll('\\', '/')
    lines.push(`|${label}:{${files.join(',')}}`)
  }

  return lines.join('\n')
}

function upsertFileMapSection(skillMd, fileMapText) {
  const block = `${MARKER_BEGIN}\n\`\`\`text\n${fileMapText}\n\`\`\`\n${MARKER_END}\n`

  const beginIndex = skillMd.indexOf(MARKER_BEGIN)
  const endIndex = skillMd.indexOf(MARKER_END)

  if (beginIndex >= 0 && endIndex >= 0 && endIndex > beginIndex) {
    const before = skillMd.slice(0, beginIndex).replace(/\s*$/, '\n\n')
    const after = skillMd.slice(endIndex + MARKER_END.length).replace(/^\s*/, '\n')
    return `${before}${block}${after}`.replace(/\n{4,}/g, '\n\n\n')
  }

  return `${skillMd.replace(/\s*$/, '\n\n')}${block}`
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const skillsRoot = path.join(scriptDir, 'skills')

  const skillDirs = listSkillDirs(skillsRoot)
  if (skillDirs.length === 0) {
    console.error(`No skills found under: ${skillsRoot}`)
    process.exit(1)
  }

  for (const dir of skillDirs) {
    const skillMdPath = path.join(dir, 'SKILL.md')
    const skillName = path.basename(dir)

    const original = readFileSync(skillMdPath, 'utf8')
    const map = walkDir(dir)
    const fileMapText = formatFileMap({ skillName, map })
    const updated = upsertFileMapSection(original, fileMapText)

    if (updated !== original) {
      writeFileSync(skillMdPath, updated, 'utf8')
      console.log(`Updated: ${path.relative(scriptDir, skillMdPath)}`)
    } else {
      console.log(`Unchanged: ${path.relative(scriptDir, skillMdPath)}`)
    }
  }
}

main()

