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
    
    // Extract route definitions with better pattern matching
    const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
    const endpoints = [];
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      let path = match[2];
      
      // Handle root path
      if (path === '/') {
        path = '';
      }
      
      // Construct full API path
      const fullPath = `/api/${routeName}${path}`;
      endpoints.push(`${method} ${fullPath}`);
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
  
  // Normalize endpoints for better matching
  function normalizeEndpoint(endpoint) {
    return endpoint
      // Normalize path parameters
      .replace(/:[\w]+/g, ':param')
      // Remove query parameters for base route matching
      .replace(/\?.*$/, '')
      // Normalize parameter patterns
      .replace(/:param\?.*$/, ':param');
  }
  
  // Create normalized lookup sets
  const normalizedBackend = new Set(allBackendEndpoints.map(normalizeEndpoint));
  const normalizedFrontend = new Set(allFrontendEndpoints.map(normalizeEndpoint));
  
  console.log("✅ CONNECTED ENDPOINTS (Frontend matches Backend):");
  let connectedCount = 0;
  allFrontendEndpoints.forEach(frontendEndpoint => {
    const normalized = normalizeEndpoint(frontendEndpoint);
    const isConnected = normalizedBackend.has(normalized);
    
    if (isConnected) {
      connectedCount++;
      console.log(`   ✅ ${frontendEndpoint}`);
    }
  });
  
  console.log("\n❌ DISCONNECTED ENDPOINTS (Frontend calls these, but no Backend match):");
  let disconnectedCount = 0;
  allFrontendEndpoints.forEach(frontendEndpoint => {
    const normalized = normalizeEndpoint(frontendEndpoint);
    const isConnected = normalizedBackend.has(normalized);
    
    if (!isConnected) {
      disconnectedCount++;
      console.log(`   ❌ ${frontendEndpoint}`);
      
      // Try to find close matches
      const possibleMatches = allBackendEndpoints.filter(backendEndpoint => {
        const backendNorm = normalizeEndpoint(backendEndpoint);
        const frontendNorm = normalized;
        
        // Check if paths are similar (ignoring method differences)
        const backendPath = backendNorm.split(' ')[1];
        const frontendPath = frontendNorm.split(' ')[1];
        
        return backendPath === frontendPath;
      });
      
      if (possibleMatches.length > 0) {
        console.log(`      💡 Possible matches: ${possibleMatches.join(', ')}`);
      }
    }
  });
  
  console.log("\n🔹 UNUSED ENDPOINTS (Backend has these, Frontend doesn't call):");
  let unusedCount = 0;
  allBackendEndpoints.forEach(backendEndpoint => {
    const normalized = normalizeEndpoint(backendEndpoint);
    const isUsed = normalizedFrontend.has(normalized);
    
    if (!isUsed) {
      unusedCount++;
      console.log(`   🔹 ${backendEndpoint}`);
    }
  });
  
  // Calculate connection percentage
  const connectionRate = Math.round((connectedCount / allFrontendEndpoints.length) * 100);
  const coverage = Math.round((allFrontendEndpoints.length / allBackendEndpoints.length) * 100);
  
  console.log(`\n📊 DETAILED ANALYSIS:`);
  console.log(`   Backend Endpoints Available: ${allBackendEndpoints.length}`);
  console.log(`   Frontend API Calls Defined: ${allFrontendEndpoints.length}`);
  console.log(`   Successfully Connected: ${connectedCount}`);
  console.log(`   Disconnected/Missing: ${disconnectedCount}`);
  console.log(`   Unused Backend APIs: ${unusedCount}`);
  console.log(`   \n🎯 CONNECTION RATE: ${connectionRate}% (${connectedCount}/${allFrontendEndpoints.length})`);
  console.log(`   📈 API COVERAGE: ${coverage}% (${allFrontendEndpoints.length}/${allBackendEndpoints.length})`);
  
  if (connectionRate >= 90) {
    console.log(`   🎉 EXCELLENT: Your APIs are well connected!`);
  } else if (connectionRate >= 70) {
    console.log(`   ✅ GOOD: Most APIs are connected, minor fixes needed`);
  } else if (connectionRate >= 50) {
    console.log(`   ⚠️  MODERATE: Significant API connection issues to resolve`);
  } else {
    console.log(`   ❌ POOR: Major API connectivity problems need attention`);
  }
}

compareAPIs();
