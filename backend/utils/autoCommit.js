import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Auto-commit uploads to GitHub
const autoCommitUploads = async () => {
  try {
    // Get the root directory
    const rootDir = process.cwd();
    const uploadsDir = path.join(rootDir, 'uploads');

    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('No uploads directory found');
      return;
    }

    try {
      // Check git status for untracked/modified files in uploads/
      const status = execSync('git status --porcelain uploads/', { cwd: rootDir }).toString();
      
      if (!status) {
        console.log('No changes in uploads/ directory');
        return;
      }

      console.log('Found changes in uploads/:', status);

      // Add uploads directory to git
      execSync('git add uploads/', { cwd: rootDir });
      console.log('✓ Added uploads/ to git staging');

      // Commit the changes
      const timestamp = new Date().toISOString();
      execSync(`git commit -m "Auto-commit: Upload new images ${timestamp}"`, { cwd: rootDir });
      console.log('✓ Committed uploads to git');

      // Push to GitHub
      execSync('git push', { cwd: rootDir });
      console.log('✓ Pushed uploads to GitHub');

    } catch (gitError) {
      // Git command might fail if there's nothing to commit, which is fine
      if (gitError.status !== 1) {
        console.error('Git error:', gitError.message);
      }
    }
  } catch (error) {
    console.error('Error in autoCommitUploads:', error.message);
    // Don't throw - this is a background operation
  }
};

export default autoCommitUploads;
