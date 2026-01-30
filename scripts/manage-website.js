#!/usr/bin/env node

/**
 * JARVIS Website Management Script
 * API-based management for GitHub Pages, analytics, and content updates
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_USER = 'repairman29';
const REPO_NAME = 'JARVIS';
const SITE_URL = `https://${GITHUB_USER}.github.io/${REPO_NAME}/`;

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\nError: ${error.message}`);
  }
}

function callGitHubAPI(endpoint, method = 'GET', data = null) {
  try {
    let curlCommand = `curl -s -L -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $(gh auth token)" -H "X-GitHub-Api-Version: 2022-11-28"`;
    
    if (method !== 'GET') {
      curlCommand += ` -X ${method}`;
    }
    
    if (data) {
      curlCommand += ` -d '${JSON.stringify(data)}'`;
    }
    
    curlCommand += ` https://api.github.com/${endpoint}`;
    
    const response = execCommand(curlCommand);
    return JSON.parse(response);
  } catch (error) {
    throw new Error(`GitHub API call failed: ${error.message}`);
  }
}

async function checkWebsiteStatus() {
  log('🌐 Checking Website Status', 'cyan');
  
  try {
    // Check GitHub Pages status
    const pagesInfo = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/pages`);
    
    log(`✅ Website Status: ${pagesInfo.status}`, 'green');
    log(`🔗 URL: ${pagesInfo.html_url}`, 'blue');
    
    if (pagesInfo.source) {
      log(`📂 Source: ${pagesInfo.source.branch} branch, ${pagesInfo.source.path} path`, 'blue');
    }
    
    // Test site accessibility
    try {
      execCommand(`curl -s -f -o /dev/null "${SITE_URL}"`);
      log('✅ Website is accessible and responding', 'green');
    } catch (error) {
      log('⚠️  Website may still be building or have connectivity issues', 'yellow');
    }
    
    // Check latest build
    try {
      const latestBuild = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/pages/builds/latest`);
      log(`📦 Latest Build: ${latestBuild.status} (${new Date(latestBuild.created_at).toLocaleString()})`, 'blue');
      
      if (latestBuild.error && latestBuild.error.message) {
        log(`❌ Build Error: ${latestBuild.error.message}`, 'red');
      }
    } catch (error) {
      log('ℹ️  Could not fetch build information', 'yellow');
    }
    
    return pagesInfo;
  } catch (error) {
    log(`❌ Failed to check website status: ${error.message}`, 'red');
    return null;
  }
}

async function updateSiteMetrics() {
  log('📊 Updating Site Metrics', 'cyan');
  
  try {
    // Get repository statistics
    const repoInfo = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}`);
    
    const metrics = {
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      watchers: repoInfo.watchers_count,
      openIssues: repoInfo.open_issues_count,
      size: repoInfo.size,
      language: repoInfo.language,
      lastUpdated: repoInfo.updated_at,
      topics: repoInfo.topics || []
    };
    
    log(`⭐ Stars: ${metrics.stars}`, 'yellow');
    log(`🍴 Forks: ${metrics.forks}`, 'yellow');
    log(`👀 Watchers: ${metrics.watchers}`, 'yellow');
    log(`🐛 Open Issues: ${metrics.openIssues}`, 'yellow');
    
    // Count skills and tools
    try {
      const skillCount = execCommand('find skills -name "skill.json" | wc -l');
      const toolCount = execCommand('grep -r \'"name":\' skills/*/skill.json | grep -c \'"name":\'');
      const codeLines = execCommand('find skills -name "*.js" | xargs wc -l | tail -1 | awk \'{print $1}\'');
      
      log(`🛠️  Skills: ${skillCount.trim()}`, 'blue');
      log(`⚙️  Tools: ${toolCount.trim()}`, 'blue');
      log(`💾 Code Lines: ${codeLines.trim()}`, 'blue');
      
      // Update README badges (could implement badge generation here)
      log('✅ Metrics collected successfully', 'green');
      
    } catch (error) {
      log(`⚠️  Could not collect code metrics: ${error.message}`, 'yellow');
    }
    
    return metrics;
  } catch (error) {
    log(`❌ Failed to update metrics: ${error.message}`, 'red');
    return null;
  }
}

async function checkCommunityHealth() {
  log('🤝 Checking Community Health', 'cyan');
  
  try {
    // Check discussions
    try {
      const discussions = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/discussions?per_page=5`);
      log(`💬 Recent Discussions: ${discussions.length}`, 'blue');
    } catch (error) {
      log('ℹ️  Discussions not available or empty', 'yellow');
    }
    
    // Check recent issues
    const issues = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/issues?state=open&per_page=10`);
    log(`🐛 Open Issues: ${issues.length}`, 'blue');
    
    // Check recent pull requests  
    const prs = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/pulls?state=open&per_page=10`);
    log(`🔧 Open Pull Requests: ${prs.length}`, 'blue');
    
    // Check contributors
    const contributors = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/contributors?per_page=10`);
    log(`👥 Contributors: ${contributors.length}`, 'blue');
    
    // Community health score (simplified)
    let healthScore = 70; // Base score
    if (issues.length < 5) healthScore += 10;
    if (prs.length > 0) healthScore += 10;
    if (contributors.length > 1) healthScore += 10;
    
    log(`💚 Community Health Score: ${healthScore}/100`, healthScore > 80 ? 'green' : healthScore > 60 ? 'yellow' : 'red');
    
    return {
      issues: issues.length,
      prs: prs.length,
      contributors: contributors.length,
      healthScore: healthScore
    };
  } catch (error) {
    log(`❌ Failed to check community health: ${error.message}`, 'red');
    return null;
  }
}

async function updateWebsiteContent() {
  log('📝 Updating Website Content', 'cyan');
  
  try {
    // Update metrics in website files
    const currentMetrics = await updateSiteMetrics();
    
    if (currentMetrics) {
      // Update index.html with latest metrics
      const indexPath = path.join(__dirname, '..', 'docs', 'site', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Update skill count if needed
        indexContent = indexContent.replace(
          /(\d+)\s+Complete Skills/g,
          `${currentMetrics.skillCount || 10} Complete Skills`
        );
        
        // Update tool count if needed  
        indexContent = indexContent.replace(
          /(\d+)\+\s+Individual Tools/g,
          `${currentMetrics.toolCount || 136}+ Individual Tools`
        );
        
        fs.writeFileSync(indexPath, indexContent);
        log('✅ Website metrics updated', 'green');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Failed to update website content: ${error.message}`, 'red');
    return false;
  }
}

async function triggerSiteRebuild() {
  log('🔄 Triggering Site Rebuild', 'cyan');
  
  try {
    // Trigger GitHub Pages rebuild via API
    const response = callGitHubAPI(`repos/${GITHUB_USER}/${REPO_NAME}/pages/builds`, 'POST');
    
    if (response.url) {
      log('✅ Site rebuild triggered successfully', 'green');
      log(`🔗 Build URL: ${response.url}`, 'blue');
    } else {
      log('ℹ️  Rebuild request submitted', 'blue');
    }
    
    return true;
  } catch (error) {
    log(`⚠️  Could not trigger rebuild: ${error.message}`, 'yellow');
    log('ℹ️  Site will rebuild automatically on next push', 'blue');
    return false;
  }
}

async function generateSEOSitemap() {
  log('🗺️  Generating SEO Sitemap', 'cyan');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}features/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}getting-started/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}about/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://github.com/${GITHUB_USER}/${REPO_NAME}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

  const sitemapPath = path.join(__dirname, '..', 'docs', 'site', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  log('✅ SEO sitemap generated', 'green');
  log(`📄 Sitemap: ${sitemapPath}`, 'blue');
  
  return sitemapPath;
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await checkWebsiteStatus();
      await updateSiteMetrics();
      await checkCommunityHealth();
      break;
      
    case 'update':
      await updateWebsiteContent();
      await generateSEOSitemap();
      await triggerSiteRebuild();
      break;
      
    case 'rebuild':
      await triggerSiteRebuild();
      break;
      
    case 'metrics':
      await updateSiteMetrics();
      break;
      
    case 'community':
      await checkCommunityHealth();
      break;
      
    case 'seo':
      await generateSEOSitemap();
      break;
      
    case 'full':
      log('🚀 Running Full Website Management', 'purple');
      await checkWebsiteStatus();
      await updateSiteMetrics();
      await checkCommunityHealth();
      await updateWebsiteContent();
      await generateSEOSitemap();
      await triggerSiteRebuild();
      log('🎉 Full management cycle complete!', 'green');
      break;
      
    case 'help':
    case undefined:
      console.log(`
🌐 JARVIS Website Management

Usage: node scripts/manage-website.js [command]

Commands:
  status      Check website status and accessibility
  update      Update website content with latest metrics
  rebuild     Trigger GitHub Pages rebuild
  metrics     Update repository and usage metrics
  community   Check community health and engagement
  seo         Generate SEO sitemap and optimization
  full        Run complete management cycle
  help        Show this help message

Examples:
  node scripts/manage-website.js status     # Check current status
  node scripts/manage-website.js update     # Update content and rebuild
  node scripts/manage-website.js full       # Complete management cycle

Website: ${SITE_URL}
Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}
`);
      break;
      
    default:
      log(`❌ Unknown command: ${command}`, 'red');
      log('Run with "help" to see available commands', 'yellow');
      process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  checkWebsiteStatus,
  updateSiteMetrics,
  checkCommunityHealth,
  updateWebsiteContent,
  triggerSiteRebuild
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}