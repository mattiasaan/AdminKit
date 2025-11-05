document.addEventListener('DOMContentLoaded', () => {
  const ipInput    = document.getElementById('ipInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn   = document.getElementById('clearBtn');
  const resultEl   = document.getElementById('result');
  const IpErrorEl  = document.getElementById('error');

  function isIPv4Basic(input) {
    // accetta IPv4 con o senza /CIDR (solo da 0 a 32)
    const regex = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
    return regex.test(input.trim());
  }

  function validateIPv4(input) {
    const [ip] = input.split('/');
    const parts = ip.trim().split('.').map(Number);
    if (parts.length !== 4) return false;
    return parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255);
  }

  function ipv4ToInt(ip) {
    const [a,b,c,d] = ip.split('.').map(Number);
    return ((a<<24) | (b<<16) | (c<<8) | d) >>> 0;
  }

  function intToIPv4(num) {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  }

  function prefixToMask(prefix) {
    return prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  }

  function ipv4Class(ipInt) {
    const first = (ipInt >>> 24) & 255;
    if (first <= 127) return 'A';
    if (first <= 191) return 'B';
    if (first <= 223) return 'C';
    if (first <= 239) return 'D (Multicast)';
    return 'E (Reserved)';
  }

  function analyzeIPv4(input) {
    const [ipStrRaw, prefixRaw] = input.split('/');
    const ipStr = ipStrRaw.trim();
    const ipInt = ipv4ToInt(ipStr);

    let prefix;
    if (prefixRaw) {
      prefix = parseInt(prefixRaw, 10);
    } else {
      const cls = ipv4Class(ipInt);
      prefix = cls === 'A' ? 8 : cls === 'B' ? 16 : 24;
    }

    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw 'Prefisso CIDR non valido (0-32)';
    }

    const maskInt = prefixToMask(prefix);
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;

    let firstHost, lastHost, numHosts;

    if (prefix === 32) {
      firstHost = lastHost = networkInt;
      numHosts = 1;
    } else if (prefix === 31) {
      firstHost = networkInt;
      lastHost = broadcastInt;
      numHosts = 2;
    } else {
      firstHost = networkInt + 1;
      lastHost = broadcastInt - 1;
      numHosts = broadcastInt - networkInt - 1;
    }

    return {
      ip: ipStr,
      prefix,
      class: ipv4Class(ipInt),
      mask: intToIPv4(maskInt),
      network: intToIPv4(networkInt),
      broadcast: intToIPv4(broadcastInt),
      hostMin: intToIPv4(firstHost),
      hostMax: intToIPv4(lastHost),
      numHosts
    };
  }

  function renderTable(result) {
    return `
      <table class="ip-table">
        <tr><th>Campo</th><th>Valore</th></tr>
        <tr><td>IP</td><td>${result.ip}</td></tr>
        <tr><td>Classe</td><td>${result.class}</td></tr>
        <tr><td>Prefisso (CIDR)</td><td>/${result.prefix}</td></tr>
        <tr><td>Subnet Mask</td><td>${result.mask}</td></tr>
        <tr><td>Network ID</td><td>${result.network}</td></tr>
        <tr><td>Broadcast</td><td>${result.broadcast}</td></tr>
        <tr><td>Host range</td><td>${result.prefix >= 31 ? 'N/A' : `${result.hostMin} — ${result.hostMax}`}</td></tr>
        <tr><td>Host utilizzabili</td><td>${result.prefix >= 31 ? 'N/A' : result.numHosts}</td></tr>
      </table>
    `;
  }

  analyzeBtn.addEventListener('click', () => {
    IpErrorEl.textContent = '';
    resultEl.innerHTML = '';

    const raw = ipInput.value.trim();
    if (!raw) {
      IpErrorEl.textContent = 'Inserisci un IP';
      return;
    }

    if (!isIPv4Basic(raw) || !validateIPv4(raw)) {
      IpErrorEl.textContent = 'Formato IPv4 non valido';
      return;
    }

    try {
      const res = analyzeIPv4(raw);
      resultEl.innerHTML = renderTable(res);
    } catch (err) {
      IpErrorEl.textContent = err;
    }
  });

  clearBtn.addEventListener('click', () => {
    ipInput.value = '';
    resultEl.innerHTML = '';
    IpErrorEl.textContent = '';
  });
});
