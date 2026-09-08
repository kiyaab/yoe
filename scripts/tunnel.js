const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const cloudflaredPath = path.join(__dirname, '..', 'bin', 'cloudflared.exe');

if (!fs.existsSync(cloudflaredPath)) {
  console.error('❌ cloudflared.exe not found in bin/ directory.');
  process.exit(1);
}

console.log('----------------------------------------------------');
console.log('🌐 STARTING CLOUDFLARE SECURE HTTPS TUNNEL (PORT 3000)');
console.log('----------------------------------------------------');

const child = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:3000']);

let tunnelUrlFound = false;

function updateTelegramMenuButton(token, url) {
  if (!token) return;
  const payload = JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: '🎡 Play Lottery',
      web_app: { url },
    },
  });

  const req = https.request(
    `https://api.telegram.org/bot${token}/setChatMenuButton`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.ok) {
            console.log('✅ Telegram Bot Menu Button successfully updated to live HTTPS URL!');
          }
        } catch {}
      });
    }
  );

  req.on('error', () => {});
  req.write(payload);
  req.end();
}

function handleOutput(data) {
  const str = data.toString();

  if (!tunnelUrlFound) {
    const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      tunnelUrlFound = true;
      const liveUrl = match[0];

      console.log('\n====================================================');
      console.log('🎉 YOUR LIVE TELEGRAM MINI APP URL IS READY:');
      console.log(`👉 ${liveUrl}`);
      console.log('====================================================\n');

      // Update .env file
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('TELEGRAM_MINI_APP_URL=')) {
          envContent = envContent.replace(/TELEGRAM_MINI_APP_URL=.*/, `TELEGRAM_MINI_APP_URL=${liveUrl}`);
        } else {
          envContent += `\nTELEGRAM_MINI_APP_URL=${liveUrl}\n`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ Automatically updated TELEGRAM_MINI_APP_URL in .env`);

        // Extract bot token to auto-update Telegram Menu button
        const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
        if (tokenMatch) {
          updateTelegramMenuButton(tokenMatch[1].trim(), liveUrl);
        }
      }
    }
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('close', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
