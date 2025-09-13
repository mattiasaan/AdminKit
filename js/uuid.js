result = document.getElementById("uuidResult")

let uuidarr = []

function generateUUIDs() {
  for(let i = 0; i < 4; i++ ) {
  let uuid = self.crypto.randomUUID();
  uuidarr.push(uuid)
  console.log(uuidarr)
  }
}

addEventListener("load", function() { 
  generateUUIDs()
  result.innerText = uuidarr.join("\n\n")
});

document.getElementById("RefreshUuidBtn").addEventListener("click", function() { 
  uuidarr = []
  generateUUIDs()
  result.innerText = uuidarr.join("\n\n")
});