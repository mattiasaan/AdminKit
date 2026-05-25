document.addEventListener('DOMContentLoaded', () => {
  const inputEl       = document.getElementById('timestampInput');
  const resultElTime  = document.getElementById('timestampResult');
  const errorEl       = document.getElementById('timestampError');

  function clearOutput() {
    errorEl.textContent   = '';
    resultElTime.textContent = '';
  }

  document.getElementById('toDateBtn').addEventListener('click', () => {
    clearOutput();
    const raw = inputEl.value.trim();

    if (!raw) {
      errorEl.textContent = 'Inserisci un valore';
      return;
    }

    if (!/^\d+$/.test(raw)) {
      errorEl.textContent = 'Inserisci un timestamp numerico (secondi o millisecondi)';
      return;
    }

    // Heuristic: timestamps > 1e12 are almost certainly milliseconds
    const num = Number(raw);
    const ms  = raw.length <= 10 ? num * 1000 : num;
    const date = new Date(ms);

    if (isNaN(date.getTime())) {
      errorEl.textContent = 'Timestamp non valido';
      return;
    }

    const s = Math.floor(ms / 1000);
    resultElTime.textContent =
      `Data locale : ${date.toLocaleString()}\n` +
      `UTC         : ${date.toISOString()}\n` +
      `Epoch (s)   : ${s}\n` +
      `Epoch (ms)  : ${ms}`;
  });

  document.getElementById('toTimestampBtn').addEventListener('click', () => {
    clearOutput();
    const raw = inputEl.value.trim();

    if (!raw) {
      errorEl.textContent = 'Inserisci un valore';
      return;
    }

    const date = new Date(raw);

    if (isNaN(date.getTime())) {
      errorEl.textContent = 'Data/ora non valida — usa il formato ISO 8601, es: 2025-09-17T17:24:37';
      return;
    }

    const ms = date.getTime();
    const s  = Math.floor(ms / 1000);
    resultElTime.textContent =
      `Timestamp (s)  : ${s}\n` +
      `Timestamp (ms) : ${ms}`;
  });
});
