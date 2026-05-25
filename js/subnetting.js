document.addEventListener('DOMContentLoaded', () => {
  const SubnetErrorEl = document.getElementById('SubnettingErr');
  const resultElSub   = document.getElementById('SubnettingOut');

  document.getElementById('subnetAnalyzeBtn').addEventListener('click', () => {
    const ip              = document.getElementById('IpInput').value.trim();
    const subnetMaskInput = document.getElementById('subnetMaskInput').value.trim();
    const subnetsRaw      = document.getElementById('subnetsInput').value.trim();
    const hostsRaw        = document.getElementById('hostsInput').value.trim();

    SubnetErrorEl.textContent = '';
    resultElSub.innerHTML     = '';

    if (!ip) {
      SubnetErrorEl.textContent = 'Inserisci un indirizzo IPv4 valido';
      return;
    }

    const subnets = subnetsRaw !== '' ? parseInt(subnetsRaw, 10) : NaN;
    const hosts   = hostsRaw   !== '' ? parseInt(hostsRaw,   10) : NaN;

    calculateSubnetting(ip, subnetMaskInput, subnets, hosts);
  });

  document.getElementById('subnetClearBtn').addEventListener('click', () => {
    document.getElementById('IpInput').value        = '';
    document.getElementById('subnetMaskInput').value = '';
    document.getElementById('subnetsInput').value   = '';
    document.getElementById('hostsInput').value     = '';
    SubnetErrorEl.textContent = '';
    resultElSub.innerHTML     = '';
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function ipToInt(ip) {
    const octets = ip.split('.');
    if (octets.length !== 4) {
      SubnetErrorEl.textContent = 'Indirizzo IP non valido';
      return null;
    }
    let result = 0;
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (isNaN(num) || num < 0 || num > 255 || octet.trim() === '') {
        SubnetErrorEl.textContent = 'Indirizzo IP non valido';
        return null;
      }
      result = (result << 8) + num;
    }
    return result >>> 0;
  }

  function intToIp(int) {
    return [
      (int >>> 24) & 0xff,
      (int >>> 16) & 0xff,
      (int >>> 8)  & 0xff,
       int         & 0xff
    ].join('.');
  }

  function subnetToCidr(subnet) {
    if (!subnet) return null;
    const octets = subnet.split('.');
    if (octets.length !== 4) {
      SubnetErrorEl.textContent = 'Subnet mask non valida';
      return null;
    }
    let cidr = 0;
    let reachedZero = false;
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        SubnetErrorEl.textContent = 'Subnet mask non valida';
        return null;
      }
      const bin = num.toString(2).padStart(8, '0');
      for (const bit of bin) {
        if (bit === '1') {
          if (reachedZero) {
            SubnetErrorEl.textContent = 'Subnet mask non valida (bit non contigui)';
            return null;
          }
          cidr++;
        } else {
          reachedZero = true;
        }
      }
    }
    return cidr;
  }

  // ── Core logic ───────────────────────────────────────────────────────────────

  function calculateSubnetting(ip, subnetMaskInput, subnets, hosts) {
    const baseIpInt = ipToInt(ip);
    if (baseIpInt === null) return;

    // Resolve CIDR — accept plain integer or dotted subnet mask
    let cidr = parseInt(subnetMaskInput, 10);
    if (isNaN(cidr)) {
      cidr = subnetToCidr(subnetMaskInput);
      if (cidr === null) return;           // error already set
    }

    if (!subnetMaskInput) {
      SubnetErrorEl.textContent = 'Inserisci una subnet mask o un prefisso CIDR';
      return;
    }
    if (cidr < 0 || cidr > 32) {
      SubnetErrorEl.textContent = 'CIDR non valido (deve essere tra 0 e 32)';
      return;
    }

    const baseMask    = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const networkBase = (baseIpInt & baseMask) >>> 0;
    const results     = [];

    if (!isNaN(subnets) && subnets > 0) {
      // ── Mode: fixed number of subnets ────────────────────────────────────────
      // FIX: subnets=1 → log2(1)=0, so clamp to 1 to actually split the network
      const bitsNeeded = Math.max(1, Math.ceil(Math.log2(subnets)));
      const newCidr    = cidr + bitsNeeded;

      if (newCidr > 32) {
        SubnetErrorEl.textContent =
          `Impossibile creare ${subnets} sottoreti da /${cidr}: servirebbero /${newCidr}`;
        return;
      }

      const subnetSize = 2 ** (32 - newCidr);

      for (let i = 0; i < subnets; i++) {
        const net       = (networkBase + i * subnetSize) >>> 0;
        const broadcast = (net + subnetSize - 1) >>> 0;
        results.push(buildSubnet(net, broadcast, newCidr));
      }

    } else if (!isNaN(hosts) && hosts > 0) {
      // ── Mode: fixed number of hosts per subnet ───────────────────────────────
      // Need at least hosts usable addresses ⇒ subnetSize = hosts + 2 (net + broadcast)
      const bitsHost = Math.ceil(Math.log2(hosts + 2));
      const newCidr  = 32 - bitsHost;

      if (newCidr < cidr) {
        SubnetErrorEl.textContent =
          `Impossibile ospitare ${hosts} host in una sottorete /${cidr}: ` +
          `servirebbe almeno /${newCidr}`;
        return;
      }
      if (newCidr > 30) {
        SubnetErrorEl.textContent =
          'Il numero minimo di host utilizzabili per una sottorete è 1 (richiede /30)';
        return;
      }

      const subnetSize  = 2 ** bitsHost;
      const numSubnets  = 2 ** (newCidr - cidr);

      for (let i = 0; i < numSubnets; i++) {
        const net       = (networkBase + i * subnetSize) >>> 0;
        const broadcast = (net + subnetSize - 1) >>> 0;
        results.push(buildSubnet(net, broadcast, newCidr));
      }

    } else {
      SubnetErrorEl.textContent =
        'Inserisci il numero di sottoreti oppure il numero di host per sottorete';
      return;
    }

    displayResults(results);
  }

  // Build a subnet descriptor, handling /31 and /32 edge cases
  function buildSubnet(net, broadcast, cidr) {
    let firstHost, lastHost, usableHosts;

    if (cidr === 32) {
      firstHost = lastHost = net;
      usableHosts = 1;
    } else if (cidr === 31) {
      firstHost = net;
      lastHost  = broadcast;
      usableHosts = 2;
    } else {
      firstHost   = net + 1;
      lastHost    = broadcast - 1;
      usableHosts = broadcast - net - 1;
    }

    return {
      net:         intToIp(net),
      broadcast:   intToIp(broadcast),
      firstHost:   intToIp(firstHost),
      lastHost:    intToIp(lastHost),
      cidr,
      usableHosts
    };
  }

  function displayResults(subnets) {
    const isEdge = cidr => cidr >= 31;
    let html = '';
    subnets.forEach((s, i) => {
      const hostRange = isEdge(s.cidr)
        ? `${s.firstHost} — ${s.lastHost}`
        : `${s.firstHost} — ${s.lastHost}`;

      html += `
        <table>
          <tr><th colspan="2">Sottorete ${i + 1}</th></tr>
          <tr><td>Rete</td><td>${s.net}/${s.cidr}</td></tr>
          <tr><td>Broadcast</td><td>${s.broadcast}</td></tr>
          <tr><td>Range host</td><td>${hostRange}</td></tr>
          <tr><td>Host utilizzabili</td><td>${s.usableHosts}</td></tr>
        </table>
      `;
    });
    document.getElementById('SubnettingOut').innerHTML = html;
  }
});
