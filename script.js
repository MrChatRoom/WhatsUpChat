let username=""
let id=Math.random().toString(36).slice(2)

let peers={}
let channels={}

const socket=new WebSocket("wss://socketsbay.com/wss/v2/1/demo/")

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
socket.send(JSON.stringify({type:"join",id:id}))
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
Object.values(channels).forEach(c=>c.send(username+": "+m))
addMessage(username+": "+m)
msgInput.value=""
}

msgInput.addEventListener("keypress",e=>{
if(e.key==="Enter")sendBtn.click()
})

function createPeer(peerId,initiator){

const pc=new RTCPeerConnection({
iceServers:[
{urls:"stun:stun.l.google.com:19302"}
]
})

if(initiator){
const ch=pc.createDataChannel("chat")
setupChannel(ch,peerId)
}

pc.ondatachannel=e=>{
setupChannel(e.channel,peerId)
}

pc.onicecandidate=e=>{
if(e.candidate){
socket.send(JSON.stringify({
type:"ice",
to:peerId,
from:id,
candidate:e.candidate
}))
}
}

peers[peerId]=pc

return pc
}

function setupChannel(ch,peerId){

channels[peerId]=ch

ch.onmessage=e=>{
addMessage(e.data)
}

}

socket.onmessage=async e=>{

const data=JSON.parse(e.data)

if(data.from===id)return

if(data.type==="join"){
const pc=createPeer(data.id,true)
const offer=await pc.createOffer()
await pc.setLocalDescription(offer)

socket.send(JSON.stringify({
type:"offer",
to:data.id,
from:id,
offer:offer
}))
}

if(data.type==="offer" && data.to===id){
const pc=createPeer(data.from,false)

await pc.setRemoteDescription(data.offer)

const answer=await pc.createAnswer()
await pc.setLocalDescription(answer)

socket.send(JSON.stringify({
type:"answer",
to:data.from,
from:id,
answer:answer
}))
}

if(data.type==="answer" && data.to===id){
await peers[data.from].setRemoteDescription(data.answer)
}

if(data.type==="ice" && data.to===id){
if(peers[data.from]){
await peers[data.from].addIceCandidate(data.candidate)
}
}

}
