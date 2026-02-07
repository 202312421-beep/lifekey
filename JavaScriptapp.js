function saveProfile(){
    let blood = document.getElementById("blood").value;
    let allergy = document.getElementById("allergy").value;
    let condition = document.getElementById("condition").value;

    let data = {blood, allergy, condition};
    let encrypted = btoa(JSON.stringify(data));
    localStorage.setItem("lifekeyData", encrypted);

    alert("Health Card Generated!");
    window.location.href="nfc_card.html";
}

function loadCard(){
    let encrypted = localStorage.getItem("lifekeyData");
    document.getElementById("cardData").innerText = encrypted || "No Data Found";
}

function loadEmergency(){
    let encrypted = localStorage.getItem("lifekeyData");
    if(!encrypted){
        alert("No Card Found!");
        return;
    }

    let data = JSON.parse(atob(encrypted));

    document.getElementById("bloodR").innerText = data.blood;
    document.getElementById("allergyR").innerText = data.allergy;
    document.getElementById("conditionR").innerText = data.condition;

    if(data.allergy !== ""){
        document.getElementById("alertBox").innerText="⚠ HIGH RISK ALLERGY DETECTED";
    }
}
const STORAGE_KEY = "lifekey.card.v1";

function nowISO(){
  return new Date().toISOString();
}

function base64Encode(str){
  return btoa(unescape(encodeURIComponent(str)));
}
function base64Decode(b64){
  return decodeURIComponent(escape(atob(b64)));
}

async function sha256Hex(message){
  
  if (!window.crypto?.subtle) return null;
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function generateEmergencyId(payload){
  const seed = JSON.stringify(payload) + "|" + nowISO() + "|" + Math.random();
  const h = await sha256Hex(seed);
  if (!h) {
    
    return "LK-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  return "LK-" + h.slice(0, 10).toUpperCase();
}

function saveToStorage(card){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
}

function readFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearStorage(){
  localStorage.removeItem(STORAGE_KEY);
}

function makeCardCode(card){
  
  return base64Encode(JSON.stringify(card));
}

function parseCardCode(code){
  const json = base64Decode(code.trim());
  return JSON.parse(json);
}


async function saveProfile(){
  const blood = document.getElementById("blood").value.trim();
  const allergy = document.getElementById("allergy").value.trim();
  const condition = document.getElementById("condition").value.trim();

  if(!blood){
    alert("اختاري فصيلة الدم أولاً.");
    return;
  }

  const payload = { blood, allergy, condition };
  const emergencyId = await generateEmergencyId(payload);

  const card = {
    v: 1,
    emergencyId,
    blood,
    allergy,
    condition,
    updatedAt: nowISO()
  };

  saveToStorage(card);
  window.location.href = "nfc_card.html";
}

function previewProfile(){
  const blood = document.getElementById("blood").value.trim();
  const allergy = document.getElementById("allergy").value.trim();
  const condition = document.getElementById("condition").value.trim();

  document.getElementById("previewBlood").innerText = blood || "-";
  document.getElementById("previewAllergy").innerText = allergy || "-";
  document.getElementById("previewCondition").innerText = condition || "-";
  document.getElementById("previewBox").style.display = "block";
}


function loadCard(){
  const card = readFromStorage();
  if(!card){
    document.getElementById("cardCode").innerText = "لا يوجد بيانات محفوظة.";
    document.getElementById("cardMeta").innerText = "";
    return;
  }

  const code = makeCardCode(card);

  document.getElementById("emergencyIdShow").innerText = card.emergencyId;
  document.getElementById("cardCode").innerText = code;
  document.getElementById("cardMeta").innerText =
    `آخر تحديث: ${new Date(card.updatedAt).toLocaleString()}`;

  
  drawSimulatedQR(code);
}

function drawSimulatedQR(text){
  const canvas = document.getElementById("qrCanvas");
  if(!canvas) return;

  const size = 260;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,size,size);

  
  let seed = 0;
  for (let i=0;i<text.length;i++) seed = (seed + text.charCodeAt(i)* (i+1)) % 100000;

  const cells = 29;
  const cell = Math.floor(size / cells);

  
  function finder(x,y){
    ctx.fillStyle="#000";
    ctx.fillRect(x,y,cell*7,cell*7);
    ctx.fillStyle="#fff";
    ctx.fillRect(x+cell,y+cell,cell*5,cell*5);
    ctx.fillStyle="#000";
    ctx.fillRect(x+cell*2,y+cell*2,cell*3,cell*3);
  }
  finder(0,0);
  finder(size-cell*7,0);
  finder(0,size-cell*7);

  
  for(let r=0;r<cells;r++){
    for(let c=0;c<cells;c++){
      const inFinder =
        (r<7 && c<7) || (r<7 && c>cells-8) || (r>cells-8 && c<7);
      if(inFinder) continue;

      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;

      if(rnd > 0.62){
        ctx.fillStyle="#000";
        ctx.fillRect(c*cell, r*cell, cell, cell);
      }
    }
  }
}

function saveCardAsImage(){
  const canvas = document.getElementById("qrCanvas");
  if(!canvas) return;

  const link = document.createElement("a");
  link.download = "LIFEKEY-Card.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function printCard(){
  window.print();
}

function goToEmergency(){
  window.location.href = "emergency.html";
}


function loadEmergencyFromStorage(){
  const card = readFromStorage();
  if(!card){
    alert("لا يوجد بطاقة محفوظة على هذا الجهاز.");
    return;
  }
  renderEmergency(card);
}

function loadEmergencyFromCode(){
  const code = document.getElementById("scanCode").value;
  if(!code.trim()){
    alert("الصقي Card Code أولاً.");
    return;
  }
  try{
    const card = parseCardCode(code);
    renderEmergency(card);
  }catch(e){
    alert("الكود غير صحيح أو تالف.");
  }
}

function renderEmergency(card){
  document.getElementById("bloodR").innerText = card.blood || "-";
  document.getElementById("allergyR").innerText = card.allergy || "-";
  document.getElementById("conditionR").innerText = card.condition || "-";
  document.getElementById("emergencyIdR").innerText = card.emergencyId || "-";

  
  const alertBox = document.getElementById("alertBox");
  const allergy = (card.allergy || "").toLowerCase();

  if(allergy.trim()){
    alertBox.style.display = "block";
    alertBox.innerText = "⚠️ تنبيه: حساسية حرجة مُسجّلة";
  }else{
    alertBox.style.display = "none";
    alertBox.innerText = "";
  }
}

function resetCard(){
  if(confirm("بدك تمسحي البيانات المحفوظة؟")){
    clearStorage();
    alert("تم المسح.");
  }
}