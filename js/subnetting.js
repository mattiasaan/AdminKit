let ip, subnetMask, subnets, hosts;
let CalculatedSubnets = [];

const SubnetErrorEl = document.getElementById("SubnettingErr");
const resultEl = document.getElementById("SubnettingOut");

document
  .getElementById("subnetAnalyzeBtn")
  .addEventListener("click", function () {
    ip = document.getElementById("IpInput").value.trim();
    subnetMask = document.getElementById("subnetMaskInput").value.trim();
    subnets = parseInt(document.getElementById("subnetsInput").value.trim());
    hosts = parseInt(document.getElementById("hostsInput").value.trim());
    SubnetErrorEl.textContent = "";
    resultEl.textContent = "";
    calculateSubnetting();
  });

document.getElementById("subnetClearBtn").addEventListener("click", function () {
  window.location.reload();
});

function calculateSubnetting() {
  CalculatedSubnets = [];
  let BaseIp = ipToInt(ip);

  if (!isNaN(subnetMask) && subnetMask > 0 && subnetMask <= 32) {
    cidr = subnetMask;
  } else {
    cidr = subnetToCidr(subnetMask);
  }

  BaseIp = BaseIp & (0xffffffff << (32 - cidr));

  if (!isNaN(subnets) && subnets > 0) {
    let bits_needed = Math.ceil(Math.log2(subnets));
    let NewCidr = cidr + bits_needed;
    let SubSize = 2 ** (32 - NewCidr);

    for (let i = 0; i < subnets; i++) {
      let net_i = (BaseIp + i * SubSize) >>> 0;
      let broadcast_i = net_i + SubSize - 1;
      let firstHost_i = net_i + 1;
      let lastHost_i = broadcast_i - 1;

      let subnetObj = {
        net: intToIp(net_i),
        broadcast: intToIp(broadcast_i),
        firstHost: intToIp(firstHost_i),
        lastHost: intToIp(lastHost_i),
        cidr: NewCidr,
      };

      CalculatedSubnets.push(subnetObj);
    }
    displayResults();
  } else if (!isNaN(hosts) && hosts > 0) {
    let bits_host = Math.ceil(Math.log2(hosts + 2));
    let NewCidr = 32 - bits_host;
    let SubSize = 2 ** (32 - NewCidr);

    let NumSub = 2 ** (32 - cidr) / 2 ** (32 - NewCidr);

    for (let i = 0; i < NumSub; i++) {
      let net_i = (BaseIp + i * SubSize) >>> 0;
      let broadcast_i = net_i + SubSize - 1;
      let firstHost_i = net_i + 1;
      let lastHost_i = broadcast_i - 1;

      let subnetObj = {
        net: intToIp(net_i),
        broadcast: intToIp(broadcast_i),
        firstHost: intToIp(firstHost_i),
        lastHost: intToIp(lastHost_i),
        cidr: NewCidr,
      };

      CalculatedSubnets.push(subnetObj);
    }
    displayResults();
  } else {
    SubnetErrorEl.textContent =
      "inserisci numero sottoreti o numero host per sottorete";
  }
}

function displayResults() {
  let html = "";

  for (let i = 0; i < CalculatedSubnets.length; i++) {
    let subnet = CalculatedSubnets[i];

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
  }

  document.getElementById("SubnettingOut").innerHTML = html;
}

function ipToInt(ip) {
  if (typeof ip !== "string") {
    SubnetErrorEl.textContent = "Indirizzo IP non valido";
    return;
  }

  let octets = ip.split(".");
  let int = 0;

  if (octets.length !== 4) {
    SubnetErrorEl.textContent = "Indirizzo IP non valido";
    return;
  }

  if (octets.some((octet) => isNaN(octet) || octet < 0 || octet > 255)) {
    SubnetErrorEl.textContent = "Indirizzo IP non valido";
    return;
  }

  for (let i = 0; i < octets.length; i++) {
    let octetValue = parseInt(octets[i]);
    int = (int << 8) + octetValue;
  }

  int = int >>> 0;
  return int;
}

function intToIp(int) {
  return (
    ((int >>> 24) & 0xff) +
    "." +
    ((int >>> 16) & 0xff) +
    "." +
    ((int >>> 8) & 0xff) +
    "." +
    (int & 0xff)
  );
}

function subnetToCidr(subnet) {
  if (typeof subnet === "number" && subnet >= 0 && subnet <= 32) {
    return subnet;
  }

  if (typeof subnet === "string") {
    let octets = subnet.split(".");
    if (octets.length !== 4) {
      SubnetErrorEl.textContent = "Subnet mask non valida";
      return;
    }
    let cidr = 0;
    for (let i = 0; i < octets.length; i++) {
      let num = parseInt(octets[i]);
      if (isNaN(num) || num < 0 || num > 255) {
        SubnetErrorEl.textContent = "Subnet mask non valida";
        return;
      }
      let binary = num.toString(2).padStart(8, "0");
      for (let bit of binary) {
        if (bit === "1") cidr++;
      }
    }
    return cidr;
  }
  SubnetErrorEl.textContent = "Subnet mask non valida";
}


