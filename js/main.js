let localPeer;
let remotePeer;
let localStream;
let datachannel;
let receiveChannel;
const startButton = document.querySelector('button#startButton')
const sendButton = document.querySelector('button#sendButton')
const closeButton = document.querySelector('button#closeButton')
startButton.onclick = PeerConnection
sendButton.onclick = send
closeButton.onclick = close

function start() {
  const constraints = {
    video: true,
    audio: false,
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return
  } else {
    navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream)

    startButton.disabled = true
    sendButton.disabled = false
    closeButton.disabled = false
    PeerConnection();
  }
}

function gotMediaStream(stream) {
  localVideo.srcObject = stream
  localStream = stream
}

function send() {
  const data = document.querySelector("textarea#dataChannelSend").value;
  console.log('send() : ' , data)
  console.log('readystate ', datachannel.readyState)
  datachannel.send(data); // localPeer的datachannel觸發send()method 傳遞資料(data)
}

function onChannelStageChange(event){
  console.log(event)
  if (event.readyState== 'open'){
    console.log('the readystate is open')
  }
  else if(event.readyState =='connecting'){
    console.log('the readystate is still connecting')
  }
}

async function PeerConnection() {
  const offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
  }
  const configuration = null;
  startButton.disabled = true
  sendButton.disabled = false
  closeButton.disabled = false
  //step: 
  //create local and remote RTCPeer
  //local Peer onicecandidate
  //local peer create data channel
  //data channel set onopen and onclose event
  //remote peer onicecandidate
  //remote peer ondatachannel binded
  //createOffer and Answer
  localPeer = new RTCPeerConnection()
  remotePeer = new RTCPeerConnection()

  localPeer.onicecandidate = (e) => {
    remotePeer.addIceCandidate(e.candidate)
    //console.log('localPeer ICE candidate:', e.candidate)
  }
  localPeer.onconnectionstatechange = (e) => {
    //console.log('local connect stage Change', e)
  }

  datachannel = localPeer.createDataChannel("my local channel");
  console.log('onopen in ')
  console.log(datachannel)
  datachannel.onopen = (e) => onChannelStageChange(e); // 當channel.[[ReadyState]] 狀態變為 "open"時觸發open事件
  console.log('onopen out')
  console.log('onclose in')
  datachannel.onclose = (e) => console.log('data channel has been closed!')
  console.log('onclose out')

  remotePeer.onicecandidate = (e) => {
    localPeer.addIceCandidate(e.candidate)
    //console.log('remotePeer ICE candidate:', e.candidate)
  }

  remotePeer.onconnectionstatechange = (e) => {
    //console.log('local connect stage Change', e)
  }
  remotePeer.ondatachannel = receiveChannelCallback; // 綁定datachannel Event
  //remotePeer.ontrack = gotRemoteStream

  /*localStream.getTracks().forEach((track) => {
    localPeer.addTrack(track, localStream)
  })*/

  //after create localpeer offer update localDescription first
  

  
  //localPeer = buildPeerConnection(localPeer, configuration);
   // 在RTCPeerConnection中建立RTCDataChannel實例
  
  
  //remotePeer = buildPeerConnection(remotePeer, configuration);
  
  //await communication(localPeer, remotePeer); // build peer-to-peer communication
  console.log(remotePeer)
  localPeer.createOffer().then(gotLocalDescription)

  document.querySelector('textarea#dataChannelSend').disabled = false
  console.log('finish Peer Connection')
}


function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0]
  }
}

function gotLocalDescription(desc) {
  localPeer.setLocalDescription(desc)
  // 2. 通過 Signaling server 將包含 Bob SDP 的offer 發送給 Alice
  // 3. Alice 收到 offer 後呼叫 setRemoteDescription 設定 Bob 的 SDP
  remotePeer.setRemoteDescription(desc)
  // 4. Alice 呼叫 RTCPeerConnection.createAnswer 建立一個 answer
  remotePeer.createAnswer().then(gotAnswerDescription)
}

function gotAnswerDescription(desc) {
  remotePeer.setLocalDescription(desc)
  // 5. 通過 Signaling server 將包含 Alice SDP 的 answer 發送給 Bob
  // 6. Bob 收到 answer  後呼叫 setRemoteDescription 設定 Alice 的SDP
  localPeer.setRemoteDescription(desc)
}

function close() {
  localPeer.close()
  remotePeer.close()
  localPeer = null
  remotePeer = null
  datachannel.close()
  startButton.disabled = false
  sendButton.disabled = true
  closeButton.disabled = true
}

function receiveChannelCallback(event) {
  console.log("Receive Channel Callback");
  receiveChannel = event.channel; // 接收來自已建立的p2p連線中的Channel
 
  // 將接收到得資料寫進textarea上
  receiveChannel.onmessage = event =>  document.querySelector("textarea#dataChannelReceive").value = event.data;
  
  // 當channel.[[ReadyState]] 狀態變為 "open"時觸發open事件
  receiveChannel.onopen = onChannelStageChange(receiveChannel); 
  receiveChannel.onclose = onChannelStageChange(receiveChannel);
}