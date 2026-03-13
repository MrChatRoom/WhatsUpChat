let username=""
let peers=[]
const login=document.getElementById("login")
const chat=document.getElementById("chat")
const joinBtn=document.getElementById("joinBtn")
const nameInput=document.getElementById("nameInput")
const messages=document.getElementById("messages")
const msgInput=document.getElementById("msgInput")
const sendBtn=document.getElementById("sendBtn")

joinBtn.onclick=()=>{
username=nameInput.value.trim()
if(!username)return
login.style.display="none"
chat.style.display="flex"
initChat()
}

function addMessage(text){
const div=document.createElement("div")
div.textContent=text
messages.appendChild(div)
messages.scrollTop=messages.scrollHeight
}

sendBtn.onclick=()=>{
const msg=msgInput.value.trim()
if(!msg)return
peers.forEach(p=>p.send(username+": "+msg))
addMessage(username+": "+msg)
msgInput.value=""
}

msgInput.addEventListener("keypress",e=>{
if(e.key==="Enter")sendBtn.click()
})

async function fetchJSON(){
try{
const res=await fetch("signaling.json?t="+Date.now())
return await res.json()
}catch{return {offers:[],answers:[]}}
}

async function pushJSON(data){
await fetch("https://api.github.com/repos/<username>/<repo>/contents/public/signaling.json", {
method:"PUT",
headers:{
"Authorization":"token <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>",
"Content-Type":"application/json"
},
body:JSON.stringify({
message:"Update signaling",
content:btoa(JSON.stringify(data))
})
})
}

function initChat(){
const pc=new RTCPeerConnection()
const channel=pc.createDataChannel("chat")
peers.push(channel)
channel.onmessage=e=>addMessage(e.data)

pc.ondatachannel=e=>{
const ch=e.channel
peers.push(ch)
ch.onmessage=ev=>addMessage(ev.data)
}

navigator.mediaDevices.getUserMedia({audio:false,video:false}).catch(()=>{})

async function syncSignaling(){
let data=await fetchJSON()

for(let i=0;i<data.offers.length;i++){
await pc.setRemoteDescription({type:"offer",sdp:data.offers[i]})
const answer=await pc.createAnswer()
await pc.setLocalDescription(answer)
data.answers.push(answer.sdp)
data.offers.splice(i,1)
i--
await pushJSON(data)
}

if(data.offers.length===0){
const offer=await pc.createOffer()
await pc.setLocalDescription(offer)
data.offers.push(offer.sdp)
await pushJSON(data)
}

setTimeout(syncSignaling,1000)
}

syncSignaling()
}
