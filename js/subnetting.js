let CalculatedSubnets = [];

const SubnetErrorEl = document.getElementById("SubnettingErr");
const resultElSub = document.getElementById("SubnettingOut");

document.getElementById("subnetAnalyzeBtn").addEventListener("click", function () {
  const ip = document.getElementById("IpInput").value.trim();
  const subnetMaskInput = document.getElementById("subnetMaskInput").value.trim();
  const subnets = parseInt(document.getElementById("subnetsInput").value.trim());
  const hosts = parseInt(document.getElementById("hostsInput").value.trim());

  SubnetErrorEl.textContent = "";
  resultElSub.innerHTML = "";

  if (!ip) {
    SubnetErrorEl.textContent = "Inserisci un indirizzo IPv4 valido";
    return;
  }

  calculateSubnetting(ip, subnetMaskInput, subnets, hosts);
});

document.getElementById("subnetClearBtn").addEventListener("click", function () {
  document.getElementById("IpInput").value = "";
  document.getElementById("subnetMaskInput").value = "";
  document.getElementById("subnetsInput").value = "";
  document.getElementById("hostsInput").value = "";
  SubnetErrorEl.textContent = "";
  resultElSub.innerHTML = "";
});

function calculateSubnetting(ip, subnetMaskInput, subnets, hosts) {
  CalculatedSubnets = [];

  const BaseIp = ipToInt(ip);
  if (BaseIp === null) return;

  let cidr = parseInt(subnetMaskInput);
  if (isNaN(cidr)) {
    cidr = subnetToCidr(subnetMaskInput);
    if (cidr === null) return;
  }
  if (cidr < 0 || cidr > 32) {
    SubnetErrorEl.textContent = "CIDR non valido";
    return;
  }

  // Maschera base
  const mask = 0xffffffff << (32 - cidr) >>> 0;
  const networkBase = BaseIp & mask;

  if (!isNaN(subnets) && subnets > 0) {
    let bitsNeeded = Math.ceil(Math.log2(subnets));
    let newCidr = cidr + bitsNeeded;
    if (newCidr > 32) {
      SubnetErrorEl.textContent = "Impossibile creare tante sottoreti con questa subnet mask";
      return;
    }
    const subnetSize = 2 ** (32 - newCidr);

    for (let i = 0; i < subnets; i++) {
      let net = networkBase + i * subnetSize;
      let broadcast = net + subnetSize - 1;
      CalculatedSubnets.push({
        net: intToIp(net),
        broadcast: intToIp(broadcast),
        firstHost: intToIp(net + 1),
        lastHost: intToIp(broadcast - 1),
        cidr: newCidr
      });
    }
  } else if (!isNaN(hosts) && hosts > 0) {
    const bitsHost = Math.ceil(Math.log2(hosts + 2));
    const newCidr = 32 - bitsHost;
    if (newCidr < cidr) {
      SubnetErrorEl.textContent = "Impossibile creare sottoreti con questo numero di host";
      return;
    }
    const subnetSize = 2 ** bitsHost;
    const numSubnets = 2 ** (newCidr - cidr);

    for (let i = 0; i < numSubnets; i++) {
      let net = networkBase + i * subnetSize;
      let broadcast = net + subnetSize - 1;
      CalculatedSubnets.push({
        net: intToIp(net),
        broadcast: intToIp(broadcast),
        firstHost: intToIp(net + 1),
        lastHost: intToIp(broadcast - 1),
        cidr: newCidr
      });
    }
  } else {
    SubnetErrorEl.textContent = "Inserisci numero di sottoreti o numero di host per sottorete";
    return;
  }

  displayResults();
}

function displayResults() {
  let html = "";
  CalculatedSubnets.forEach((subnet, i) => {
    html += `
      <table>
        <tr><th colspan="2">Sottorete ${i + 1}</th></tr>
        <tr><td>Rete</td><td>${subnet.net}</td></tr>
        <tr><td>Prefisso (CIDR)</td><td>/${subnet.cidr}</td></tr>
        <tr><td>Broadcast</td><td>${subnet.broadcast}</td></tr>
        <tr><td>Primo Host</td><td>${subnet.firstHost}</td></tr>
        <tr><td>Ultimo Host</td><td>${subnet.lastHost}</td></tr>
      </table>
    `;
  });

  resultElSub.innerHTML = html;
}

function ipToInt(ip) {
  const octets = ip.split(".");
  if (octets.length !== 4) {
    SubnetErrorEl.textContent = "Indirizzo IP non valido";
    return null;
  }
  let int = 0;
  for (let octet of octets) {
    const num = parseInt(octet);
    if (isNaN(num) || num < 0 || num > 255) {
      SubnetErrorEl.textContent = "Indirizzo IP non valido";
      return null;
    }
    int = (int << 8) + num;
  }
  return int >>> 0;
}

function intToIp(int) {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff
  ].join(".");
}

function subnetToCidr(subnet) {
  const octets = subnet.split(".");
  if (octets.length !== 4) {
    SubnetErrorEl.textContent = "Subnet mask non valida";
    return null;
  }
  let cidr = 0;
  let reachedZero = false;
  for (let octet of octets) {
    const num = parseInt(octet);
    if (isNaN(num) || num < 0 || num > 255) {
      SubnetErrorEl.textContent = "Subnet mask non valida";
      return null;
    }
    const bin = num.toString(2).padStart(8, "0");
    for (let bit of bin) {
      if (bit === "1") {
        if (reachedZero) {
          SubnetErrorEl.textContent = "Subnet mask non valida";
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
