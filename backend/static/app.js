const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const videoEl = document.getElementById('video');

function setStatus(text) {
  statusEl.textContent = text;
}

async function postJSON(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

startBtn.addEventListener('click', async () => {
  try {
    setStatus('Starting...');
    await postJSON('/start');
    // Bust cache to force refresh when starting again
    videoEl.src = `/video_feed?ts=${Date.now()}`;
    setStatus('Streaming');
  } catch (e) {
    console.error(e);
    setStatus('Failed to start');
  }
});

stopBtn.addEventListener('click', async () => {
  try {
    setStatus('Stopping...');
    await postJSON('/stop');
    videoEl.src = '';
    setStatus('Stopped');
  } catch (e) {
    console.error(e);
    setStatus('Failed to stop');
  }
});

// Clean up when navigating away
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/stop');
});


