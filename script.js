let username=""
let peers=[]
let connections={}
let id=Math.random().toString(36).substring(2)

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
start()
}

function addMessage(t){
const d=document.createElement("div")
d.textContent=t
messages.appendChild(d)
messages.scrollTop=messages.scrollHeight
}

sendBtn.onclick=()=>{
const m=msgInput.value.trim()
if(!m)return
Object.values(connections).forEach(c=>c.send(username+": "+m))
addMessage(username+": "+m)
msgInput.value=""
}

msgInput.addEventListener("keypress",e=>{
if(e.key==="Enter")sendBtn.click()
})

async function getSignal(){
try{
const r=await fetch("signaling.json?t="+Date.now())
return await r.json()
}catch{
return {offers:[],answers:[]}
}
}

async function sendSignal(data){
await fetch("signaling.json",{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(data)
})
}

function createPeer(peerId,offer){
const pc=new RTCPeerConnection()

pc.ondatachannel=e=>{
const ch=e.channel
connections[peerId]=ch
ch.onmessage=ev=>addMessage(ev.data)
}

if(!offer){
const ch=pc.createDataChannel("chat")
connections[peerId]=ch
ch.onmessage=e=>addMessage(e.data)
}

return pc
}

async function start(){

let pc=createPeer("host")

const offer=await pc.createOffer()
await pc.setLocalDescription(offer)

let data=await getSignal()
data.offers.push({id:id,sdp:offer.sdp})
await sendSignal(data)

setInterval(async()=>{

let signal=await getSignal()

for(const o of signal.offers){
if(o.id!==id && !connections[o.id]){
let peer=createPeer(o.id,true)
await peer.setRemoteDescription({type:"offer",sdp:o.sdp})
let ans=await peer.createAnswer()
await peer.setLocalDescription(ans)

signal.answers.push({to:o.id,from:id,sdp:ans.sdp})
await sendSignal(signal)
}
}

for(const a of signal.answers){
if(a.to===id && !connections[a.from]){
await pc.setRemoteDescription({type:"answer",sdp:a.sdp})
}
}

},1000)

}
