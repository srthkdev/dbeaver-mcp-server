import { defineConfig } from 'bumpp';

export default defineConfig({
  files: [
    'package.json',
    'README.md',
    'src/index.ts',
  ],
  
  // Commit and tag settings
  commit: 'chore: bump version to v%s',
  tag: 'v%s',
  push: false, // Don't auto-push, let user review changes first
  
  // Execute build after version bump
  execute: 'npm run build',
  
  // Show all changes before committing
  all: true,
  
  // Confirm before committing
  confirm: true,
});

