let input;

const resultEl = document.getElementById('timestampResult');
const TimestampErrorEl = document.getElementById('timestampError');

document.getElementById('timestampInput').addEventListener('input', function() {
  input = this.value;
});

document.getElementById('toDateBtn').addEventListener('click', function() {
  let timestamp = input;
  TimestampErrorEl.textContent = '';
  resultEl.textContent = '';

  if (!timestamp) {
    TimestampErrorEl.textContent = 'Inserisci un valore';
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
      TimestampErrorEl.textContent = 'Timestamp non valido';
    } else {
      resultEl.textContent = `Data locale: ${date.toLocaleString()} | UTC: ${date.toISOString()}`;
    }
  } else {
    TimestampErrorEl.textContent = 'Inserisci un timestamp numerico';
  }
});

document.getElementById('toTimestampBtn').addEventListener('click', function() { 
  let date = input;
  TimestampErrorEl.textContent = '';
  resultEl.textContent = '';

  if (!date) {
    TimestampErrorEl.textContent = 'Inserisci un valore';
    return;
  }

  const timestamp = new Date(date);

  if (isNaN(timestamp.getTime())) {
    TimestampErrorEl.textContent = 'Data/ora non valida';
    return;
  }

  resultEl.textContent = `Timestamp (ms): ${timestamp.getTime()} | Timestamp (s): ${Math.floor(timestamp.getTime() / 1000)}`;
});
