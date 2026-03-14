let username=""
const id=Math.random().toString(36).slice(2)

const login=document.getElementById("login")
const chat=document.getElementById("chat")
const joinBtn=document.getElementById("joinBtn")
const nameInput=document.getElementById("nameInput")
const messages=document.getElementById("messages")
const msgInput=document.getElementById("msgInput")
const sendBtn=document.getElementById("sendBtn")

const socket=new WebSocket("wss://ws.ifelse.io")

joinBtn.onclick=()=>{
username=nameInput.value.trim()
if(!username)return
login.style.display="none"
chat.style.display="flex"

socket.send(JSON.stringify({
type:"join",
id:id,
name:username
}))
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

socket.send(JSON.stringify({
type:"msg",
id:id,
name:username,
text:m
}))

addMessage(username+": "+m)
msgInput.value=""
}

msgInput.addEventListener("keypress",e=>{
if(e.key==="Enter")sendBtn.click()
})

socket.onmessage=e=>{
try{
const data=JSON.parse(e.data)
if(data.id!==id && data.type==="msg"){
addMessage(data.name+": "+data.text)
}
}catch{}
}
