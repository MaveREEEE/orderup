// Update to replace token retrieval from localStorage to sessionStorage

// Example of updated code in files under admin/src/pages directory

function exampleFunction() {
    const token = sessionStorage.getItem("token");  // Updated line
    // ... additional logic
}