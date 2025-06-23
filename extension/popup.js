
// LiNX Extension Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const authTokenInput = document.getElementById('authToken');
  const statusDiv = document.getElementById('status');
  const linxLink = document.getElementById('linxLink');

  // Set LiNX app link
  linxLink.href = 'https://jayfyarydzkycjzciblj.supabase.co';
  linxLink.onclick = () => chrome.tabs.create({ url: linxLink.href });

  // Load saved configuration
  try {
    const result = await chrome.storage.sync.get(['linxAuthToken']);
    if (result.linxAuthToken) {
      authTokenInput.value = result.linxAuthToken;
      showStatus('Configuration loaded', 'success');
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const authToken = authTokenInput.value.trim();
    
    if (!authToken) {
      showStatus('Please enter your authentication token', 'error');
      return;
    }

    try {
      // Save configuration
      await chrome.storage.sync.set({ linxAuthToken: authToken });
      showStatus('Configuration saved successfully!', 'success');
      
      // Test the token by making a simple request
      setTimeout(async () => {
        try {
          const response = await fetch('https://jayfyarydzkycjzciblj.supabase.co/rest/v1/profiles?select=id', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpheWZ5YXJ5ZHpreWNqemNpYmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4ODksImV4cCI6MjA2NjI4Nzg4OX0.Haq3hDHxPTBdIVoHVuTa_moX8BJUVoWyV2J5mRSlDeI'
            }
          });
          
          if (response.ok) {
            showStatus('✓ Token validated successfully!', 'success');
          } else {
            showStatus('⚠ Token saved but validation failed. Please check your token.', 'error');
          }
        } catch (error) {
          showStatus('⚠ Token saved but validation failed. Please check your token.', 'error');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error saving config:', error);
      showStatus('Error saving configuration', 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 3000);
    }
  }
});
