document.addEventListener('DOMContentLoaded', () => {
  const ipInput    = document.getElementById('ipInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn   = document.getElementById('clearBtn');
  const resultElIp = document.getElementById('result');
  const IpErrorEl  = document.getElementById('error');

  // ── Validation ────────────────────────────────────────────────────────────

  function isIPv4Basic(input) {
    const regex = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
    return regex.test(input.trim());
  }

  function validateIPv4(input) {
    const [ip] = input.split('/');
    const parts = ip.trim().split('.').map(Number);
    if (parts.length !== 4) return false;
    return parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255);
  }

  // ── Conversion helpers ────────────────────────────────────────────────────

  function ipv4ToInt(ip) {
    const [a, b, c, d] = ip.split('.').map(Number);
    return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
  }

  function intToIPv4(num) {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8)  & 255,
       num         & 255
    ].join('.');
  }

  function prefixToMask(prefix) {
    return prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  }

  // ── Classification ────────────────────────────────────────────────────────

  function ipv4Class(ipInt) {
    const first = (ipInt >>> 24) & 255;
    if (first <= 127) return 'A';
    if (first <= 191) return 'B';
    if (first <= 223) return 'C';
    if (first <= 239) return 'D (Multicast)';
    return 'E (Reserved)';
  }

  function isPrivate(ipInt) {
    const a = (ipInt >>> 24) & 255;
    const b = (ipInt >>> 16) & 255;
    if (a === 10)                       return true;  // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168)          return true; // 192.168.0.0/16
    return false;
  }

  // ── Core analysis ─────────────────────────────────────────────────────────

  function analyzeIPv4(input) {
    const [ipStrRaw, prefixRaw] = input.split('/');
    const ipStr = ipStrRaw.trim();
    const ipInt = ipv4ToInt(ipStr);

    let prefix;
    if (prefixRaw !== undefined) {
      prefix = parseInt(prefixRaw, 10);
    } else {
      const cls = ipv4Class(ipInt);
      prefix = cls === 'A' ? 8 : cls === 'B' ? 16 : 24;
    }

    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw 'Prefisso CIDR non valido (0–32)';
    }

    const maskInt      = prefixToMask(prefix);
    const networkInt   = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;

    let firstHost, lastHost, numHosts;

    if (prefix === 32) {
      firstHost = lastHost = networkInt;
      numHosts  = 1;
    } else if (prefix === 31) {
      firstHost = networkInt;
      lastHost  = broadcastInt;
      numHosts  = 2;
    } else {
      firstHost = networkInt + 1;
      lastHost  = broadcastInt - 1;
      numHosts  = broadcastInt - networkInt - 1;
    }

    return {
      ip:        ipStr,
      prefix,
      class:     ipv4Class(ipInt),
      private:   isPrivate(ipInt),
      mask:      intToIPv4(maskInt),
      network:   intToIPv4(networkInt),
      broadcast: intToIPv4(broadcastInt),
      hostMin:   intToIPv4(firstHost),
      hostMax:   intToIPv4(lastHost),
      numHosts
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderTable(r) {
    // For /31 and /32 there is no traditional broadcast/host-range concept
    const hostRangeRow = r.prefix >= 32
      ? `<tr><td>Host unico</td><td>${r.hostMin}</td></tr>`
      : r.prefix === 31
        ? `<tr><td>Host range</td><td>${r.hostMin} — ${r.hostMax}</td></tr>
           <tr><td>Host utilizzabili</td><td>2 (point-to-point, RFC 3021)</td></tr>`
        : `<tr><td>Host range</td><td>${r.hostMin} — ${r.hostMax}</td></tr>
           <tr><td>Host utilizzabili</td><td>${r.numHosts}</td></tr>`;

    return `
      <table class="ip-table">
        <tr><th>Campo</th><th>Valore</th></tr>
        <tr><td>IP</td><td>${r.ip}</td></tr>
        <tr><td>Classe</td><td>${r.class}</td></tr>
        <tr><td>Privato</td><td>${r.private ? 'Sì (RFC 1918)' : 'No (pubblico)'}</td></tr>
        <tr><td>Prefisso (CIDR)</td><td>/${r.prefix}</td></tr>
        <tr><td>Subnet Mask</td><td>${r.mask}</td></tr>
        <tr><td>Network ID</td><td>${r.network}</td></tr>
        <tr><td>Broadcast</td><td>${r.prefix >= 31 ? 'N/A' : r.broadcast}</td></tr>
        ${hostRangeRow}
      </table>
    `;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  analyzeBtn.addEventListener('click', () => {
    IpErrorEl.textContent = '';
    resultElIp.innerHTML  = '';

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
      resultElIp.innerHTML = renderTable(analyzeIPv4(raw));
    } catch (err) {
      IpErrorEl.textContent = err;
    }
  });

  clearBtn.addEventListener('click', () => {
    ipInput.value         = '';
    resultElIp.innerHTML  = '';
    IpErrorEl.textContent = '';
  });

  // Allow Enter key to trigger analysis
  ipInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') analyzeBtn.click();
  });
});
