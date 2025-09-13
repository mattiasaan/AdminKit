document.addEventListener('DOMContentLoaded', () => {

  const inputText  = document.getElementById('inputText');
  const typeSelect = document.getElementById('typeSelect');
  const encodeBtn  = document.getElementById('encodeBtn');
  const decodeBtn  = document.getElementById('decodeBtn');
  const clearBtn   = document.getElementById('clearEncoderBtn');
  const outputEl   = document.getElementById('output');
  const errorEl    = document.getElementById('errorEncoder');

  function encodeText(text, type) {
    if (!text) return '';
    switch(type) {
      case 'base64':
        return btoa(unescape(encodeURIComponent(text))); //unescape da cambiare deprecated
      case 'hex':
        return Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
      case 'url':
        return encodeURIComponent(text);
      default:
        throw 'Tipo di codifica sconosciuto';
    }
  }           

  function decodeText(text, type) {
    if (!text) return '';
    switch(type) {
      case 'base64':
        try { return decodeURIComponent(escape(atob(text))); } //escape da cambiare deprecated
        catch { throw 'Base64 non valido'; }
      case 'hex':
        try { return text.match(/.{1,2}/g).map(h => String.fromCharCode(parseInt(h,16))).join(''); }
        catch { throw 'Hex non valido'; }
      case 'url':
        try { return decodeURIComponent(text); }
        catch { throw 'URL non valido'; }
      default:
        throw 'Tipo di codifica sconosciuto';
    }
  }

  encodeBtn.addEventListener('click', () => {
    errorEl.textContent = outputEl.textContent = '';
    try { outputEl.textContent = encodeText(inputText.value, typeSelect.value); }
    catch(err) { errorEl.textContent = err; }
  });

  decodeBtn.addEventListener('click', () => {
    errorEl.textContent = outputEl.textContent = '';
    try { outputEl.textContent = decodeText(inputText.value, typeSelect.value); }
    catch(err) { errorEl.textContent = err; }
  });

  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputEl.textContent = '';
    errorEl.textContent = '';
  });

});
