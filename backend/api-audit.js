require("dotenv").config();
const fs = require('fs');
const path = require('path');

function extractAPIEndpoints() {
  console.log("🔍 BACKEND API ENDPOINTS AUDIT\n");
  
  const routesDir = './src/routes';
  const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js') && file !== 'index.js');
  
  const allEndpoints = {};
  
  files.forEach(file => {
    const routeName = file.replace('.js', '');
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract route definitions
    const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
    const endpoints = [];
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      endpoints.push(`${method} /api/${routeName}${path === '/' ? '' : path}`);
    }
    
    allEndpoints[routeName] = endpoints;
  });
  
  // Display results
  Object.entries(allEndpoints).forEach(([routeName, endpoints]) => {
    console.log(`📁 ${routeName.toUpperCase()} ROUTES:`);
    endpoints.forEach(endpoint => console.log(`   ${endpoint}`));
    console.log('');
  });
  
  // Count totals
  const totalEndpoints = Object.values(allEndpoints).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📊 TOTAL BACKEND ENDPOINTS: ${totalEndpoints}\n`);
  
  return allEndpoints;
}

function extractFrontendAPIUsage() {
  console.log("🎯 FRONTEND API USAGE AUDIT\n");
  
  try {
    const apiServicePath = '../frontend/src/services/api.js';
    if (!fs.existsSync(apiServicePath)) {
      console.log("❌ Frontend api.js not found");
      return {};
    }
    
    const content = fs.readFileSync(apiServicePath, 'utf8');
    
    // Extract API calls with multiple patterns
    const patterns = [
      // Pattern 1: functionName: (params) => api.method("/path")
      /(\w+):\s*\([^)]*\)\s*=>\s*api\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g,
      // Pattern 2: functionName: (params) => api.method(`/path${variable}`)
      /(\w+):\s*\([^)]*\)\s*=>\s*api\.(get|post|put|delete|patch)\s*\(\s*`([^`]+)`/g
    ];
    
    const frontendAPIs = {};
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        const method = match[2].toUpperCase();
        let path = match[3];
        
        // Handle template literals by removing variables
        path = path.replace(/\$\{[^}]+\}/g, ':param');
        
        // Ensure path starts with /
        if (!path.startsWith('/')) path = '/' + path;
        
        const category = path.split('/')[1] || 'root';
        if (!frontendAPIs[category]) frontendAPIs[category] = [];
        
        // Avoid duplicates
        const endpoint = `${method} /api${path}`;
        const exists = frontendAPIs[category].some(api => api.endpoint === endpoint);
        if (!exists) {
          frontendAPIs[category].push({
            function: functionName,
            endpoint: endpoint
          });
        }
      }
    });
    
    // Display results
    Object.entries(frontendAPIs).forEach(([category, apis]) => {
      console.log(`🎯 ${category.toUpperCase()} API CALLS:`);
      apis.forEach(api => console.log(`   ${api.function}() -> ${api.endpoint}`));
      console.log('');
    });
    
    return frontendAPIs;
  } catch (error) {
    console.log("❌ Error reading frontend API file:", error.message);
    return {};
  }
}

function compareAPIs() {
  console.log("🔄 API CONNECTIVITY ANALYSIS\n");
  
  const backendAPIs = extractAPIEndpoints();
  const frontendAPIs = extractFrontendAPIUsage();
  
  // Flatten backend endpoints
  const allBackendEndpoints = Object.values(backendAPIs).flat();
  
  // Flatten frontend endpoints
  const allFrontendEndpoints = Object.values(frontendAPIs).flat().map(api => api.endpoint);
  
  console.log("✅ USED ENDPOINTS (Frontend calls these):");
  allFrontendEndpoints.forEach(endpoint => {
    const isImplemented = allBackendEndpoints.includes(endpoint);
    const status = isImplemented ? "✅" : "❌ MISSING";
    console.log(`   ${status} ${endpoint}`);
  });
  
  console.log("\n⚠️  UNUSED ENDPOINTS (Backend has these, Frontend doesn't use):");
  allBackendEndpoints.forEach(endpoint => {
    const isUsed = allFrontendEndpoints.includes(endpoint);
    if (!isUsed) {
      console.log(`   🔹 ${endpoint}`);
    }
  });
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Backend Endpoints: ${allBackendEndpoints.length}`);
  console.log(`   Frontend API Calls: ${allFrontendEndpoints.length}`);
  console.log(`   Used Endpoints: ${allFrontendEndpoints.filter(ep => allBackendEndpoints.includes(ep)).length}`);
  console.log(`   Missing Endpoints: ${allFrontendEndpoints.filter(ep => !allBackendEndpoints.includes(ep)).length}`);
  console.log(`   Unused Endpoints: ${allBackendEndpoints.filter(ep => !allFrontendEndpoints.includes(ep)).length}`);
}

compareAPIs();
