document.addEventListener('DOMContentLoaded', () => {
  const resultEl = document.getElementById('uuidResult');

  function generateUUIDs() {
    const uuids = [];
    for (let i = 0; i < 4; i++) {
      uuids.push(self.crypto.randomUUID());
    }
    resultEl.innerText = uuids.join('\n\n');
  }

  generateUUIDs();

  document.getElementById('RefreshUuidBtn').addEventListener('click', generateUUIDs);
});
