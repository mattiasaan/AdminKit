let input;

const resultEl = document.getElementById('timestampResult');
const errorEl = document.getElementById('timestampError');

document.getElementById('timestampInput').addEventListener('input', function() {
  input = this.value;
});

document.getElementById('toDateBtn').addEventListener('click', function() {
  let timestamp = input;
  errorEl.textContent = '';
  resultEl.textContent = '';

  if (!timestamp) {
    errorEl.textContent = 'Inserisci un valore';
    return;
  }

  if (/^\d+$/.test(timestamp)) {
    let ms, s;
    if (timestamp.length <= 10) {
      // Input in s
      s = Number(timestamp);
      ms = s * 1000;
    } else {
      // Input in ms
      ms = Number(timestamp);
      s = Math.floor(ms / 1000);
    }
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      errorEl.textContent = 'Timestamp non valido';
    } else {
      resultEl.textContent = `Data locale: ${date.toLocaleString()} | UTC: ${date.toISOString()}`;
    }
  } else {
    errorEl.textContent = 'Inserisci un timestamp numerico';
  }
});

document.getElementById('toTimestampBtn').addEventListener('click', function() { 
  let date = input;
  errorEl.textContent = '';
  resultEl.textContent = '';

  if (!date) {
    errorEl.textContent = 'Inserisci un valore';
    return;
  }

  const timestamp = new Date(date);

  if (isNaN(timestamp.getTime())) {
    errorEl.textContent = 'Data/ora non valida';
    return;
  }

  resultEl.textContent = `Timestamp (ms): ${timestamp.getTime()} | Timestamp (s): ${Math.floor(timestamp.getTime() / 1000)}`;
});
