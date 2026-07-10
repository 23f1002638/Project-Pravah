const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const port = 5000;
const urlFilePath = path.join(__dirname, '..', 'tunnel_url.txt');

(async () => {
  try {
    console.log(`Starting localtunnel on port ${port}...`);
    const tunnel = await localtunnel({ port: port });

    console.log(`Tunnel is open at: ${tunnel.url}`);
    
    // Write URL to file
    fs.writeFileSync(urlFilePath, tunnel.url, 'utf8');
    console.log(`Saved URL to ${urlFilePath}`);

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
      if (fs.existsSync(urlFilePath)) {
        fs.unlinkSync(urlFilePath);
      }
    });

  } catch (err) {
    console.error('Error starting localtunnel:', err);
    fs.writeFileSync(urlFilePath, `ERROR: ${err.message}`, 'utf8');
  }
})();
