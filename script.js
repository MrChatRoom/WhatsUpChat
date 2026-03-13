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

async function updateJSON(data){
await fetch("signaling.json",{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
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

// connect to all offers
for(let i=0;i<data.offers.length;i++){
const offer=data.offers[i]
await pc.setRemoteDescription({type:"offer",sdp:offer})
const answer=await pc.createAnswer()
await pc.setLocalDescription(answer)
data.answers.push(answer.sdp)
data.offers.splice(i,1)
i--
await updateJSON(data)
}

// share local offer if no one exists
if(data.offers.length===0){
const offer=await pc.createOffer()
await pc.setLocalDescription(offer)
data.offers.push(offer.sdp)
await updateJSON(data)
}

setTimeout(syncSignaling,1000)
}

syncSignaling()
}
