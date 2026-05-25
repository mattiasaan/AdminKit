document.addEventListener('DOMContentLoaded', () => {
  const inputText  = document.getElementById('inputText');
  const typeSelect = document.getElementById('typeSelect');
  const encodeBtn  = document.getElementById('encodeBtn');
  const decodeBtn  = document.getElementById('decodeBtn');
  const clearBtn   = document.getElementById('clearEncoderBtn');
  const outputEl   = document.getElementById('output');
  const errorEl    = document.getElementById('errorEncoder');

  // --- Encode ---
  function encodeText(text, type) {
    if (!text) return '';
    switch (type) {
      case 'base64': {
        // Correct UTF-8 → Base64 without deprecated unescape()
        const bytes = new TextEncoder().encode(text);
        let binary  = '';
        bytes.forEach(b => { binary += String.fromCharCode(b); });
        return btoa(binary);
      }
      case 'hex':
        return Array.from(new TextEncoder().encode(text))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      case 'url':
        return encodeURIComponent(text);
      default:
        throw new Error('Tipo di codifica sconosciuto');
    }
  }

  // --- Decode ---
  function decodeText(text, type) {
    if (!text) return '';
    switch (type) {
      case 'base64': {
        let binary;
        try { binary = atob(text.trim()); }
        catch { throw new Error('Base64 non valido'); }
        // Correct Base64 → UTF-8 without deprecated escape()
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
      case 'hex': {
        const clean = text.trim().replace(/\s+/g, '');
        if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Hex non valido: caratteri non esadecimali');
        if (clean.length % 2 !== 0) throw new Error('Hex non valido: numero di caratteri dispari');
        const bytes = new Uint8Array(clean.match(/.{2}/g).map(h => parseInt(h, 16)));
        return new TextDecoder().decode(bytes);
      }
      case 'url':
        try { return decodeURIComponent(text); }
        catch { throw new Error('URL encoding non valido'); }
      default:
        throw new Error('Tipo di codifica sconosciuto');
    }
  }

  encodeBtn.addEventListener('click', () => {
    errorEl.textContent = '';
    outputEl.textContent = '';
    try { outputEl.textContent = encodeText(inputText.value, typeSelect.value); }
    catch (err) { errorEl.textContent = err.message; }
  });

  decodeBtn.addEventListener('click', () => {
    errorEl.textContent = '';
    outputEl.textContent = '';
    try { outputEl.textContent = decodeText(inputText.value, typeSelect.value); }
    catch (err) { errorEl.textContent = err.message; }
  });

  clearBtn.addEventListener('click', () => {
    inputText.value      = '';
    outputEl.textContent = '';
    errorEl.textContent  = '';
  });
});
