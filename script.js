let ws
let username=""

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

ws=new WebSocket("ws://localhost:3000")

ws.onmessage=e=>{
const div=document.createElement("div")
div.textContent=e.data
messages.appendChild(div)
messages.scrollTop=messages.scrollHeight
}

login.style.display="none"
chat.style.display="flex"
}

sendBtn.onclick=()=>{
const msg=msgInput.value.trim()
if(!msg)return
ws.send(username+": "+msg)
msgInput.value=""
}

msgInput.addEventListener("keypress",e=>{
if(e.key==="Enter")sendBtn.click()
})