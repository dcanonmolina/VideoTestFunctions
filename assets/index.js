const VideoProcessors = Twilio.VideoProcessors;
let videoTrack = null; 

$(document).ready(function(){
    let isBackgroundOn = false;
    let addBackground;
    $("#enterMeeting").click(function(){
        let userName = $("#userName").val();
        let roomName = $("#roomName").val();

        if(!userName){
            alert("Please enter a user name!");
            return;
        }

        if(!roomName){
            alert("Please enter a room name!");
            return;
        }

        $("#welcomePanel").hide();
        $("#controlPanel").show();

        connectVideoRoom(userName, roomName)
            .then(token =>{
                (token);
            })
            .catch(err =>{
                console.error(err);
                alert(err)
            });
        
    });

    $("#buttonBackground").click(function(){

      if(!videoTrack) return;

      if(!isBackgroundOn){
        const img = new Image();

        img.onload = () =>  {
          addBackground = new VideoProcessors.VirtualBackgroundProcessor({
            assetsPath: './background',
            backgroundImage: img,
          });
        
          addBackground.loadModel().then(() => {
            videoTrack.addProcessor(addBackground);
            isBackgroundOn = !isBackgroundOn;
          });
        };
        img.src = './background/180132.jpg';
         
        $("#buttonBackground").html('Disable Background');
        $(this).removeClass('btn-info');
        $(this).addClass('btn btn-warning');
      }else
      {
        videoTrack.removeProcessor(addBackground);
        isBackgroundOn = !isBackgroundOn;

        $("#buttonBackground").html('Enable Background');
        
        $("#buttonBackground").removeClass('btn-warning');
        $("#buttonBackground").addClass('btn-info');
      }

    });
});





async function getToken(identity) {
    const response = await fetch(`/createToken?identity=${encodeURIComponent(identity)}`, {mode: 'cors'});
    if (!response.ok) {
      console.error(response);
      throw new Error('Unable to fetch Access Token');
    }
    return response.text();
  }




async function connectVideoRoom(name, room){
    try{

        let token = await getToken(name);

        //let trackCanvas = await fetchLocalTrackCanvas();
        //let localTracks = await Twilio.Video.createLocalTracks();
       
        let audioTrack = await Twilio.Video.createLocalAudioTrack();
        videoTrack = await Twilio.Video.createLocalVideoTrack({name: 'myCam',
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }});

          connectionToRoom = await Twilio.Video.connect(token,{
            name: room,
            tracks: [audioTrack, videoTrack]
        });
        videoTrack.attach( document.getElementById('localVideo'));
        
        $("#buttonBackground").show();


        //let publication = await connectionToRoom.localParticipant.publishTrack(trackCanvas);

        connectionToRoom.participants.forEach(participantConnected);
        connectionToRoom.on('participantConnected', participantConnected);
        connectionToRoom.on('participantDisconnected', participantDisconnected);

        connectionToRoom.once('disconnected', roomDisconnected);

        connectionToRoom.localParticipant.on('trackPublished', publication => {
            if (publication.track === dataTrack) {
              dataTrackPublished.resolve();
            }
          });
          
          connectionToRoom.localParticipant.on('trackPublicationFailed', (error, track) => {
            if (track === dataTrack) {
              dataTrackPublished.reject(error);
            }
          });

        $("#sendMessageRoom").click(function(){
            sendMessage(JSON.stringify({"time": "Hello " + new Date()}));
        });
        
    }
    catch(err){
        console.error(err);
    }
}



function participantConnected(participant) {

    let divInput = document.getElementById('remoteVideo');
    let newParticipantElement = document.createElement("div");
    newParticipantElement.setAttribute('id', participant.sid);


    divInput.appendChild(newParticipantElement);
    newParticipantElement.appendChild(document.createElement("audio"));

    let videoRemoteParticipant = document.createElement("video");
    videoRemoteParticipant.setAttribute("width", "640");
    videoRemoteParticipant.setAttribute("height", "480");
    newParticipantElement.appendChild(videoRemoteParticipant);

    let h5title = document.getElementById('remoteParticipantName');
    h5title.innerHTML=participant.identity;
    

    participant.tracks.forEach(publication => trackPublished(participant, publication));
    participant.on('trackPublished', publication => trackPublished(participant, publication));
    participant.on('trackUnpublished', publication => trackUnpublished(participant, publication));
    participant.on('disconnected', participant1 => diconectionsParticipant(participant1));
  }

  function trackPublished(participant, publication) {
    console.log(`RemoteParticipant "${participant.identity}" published ${publication.kind} Track ${publication.trackSid}`);

    console.log(`Published LocalTrack: ${publication.track}`);
    if (publication.isSubscribed) {
      trackSubscribed(participant, publication.track);
    } else {
      publication.on('subscribed', track => trackSubscribed(participant, track));
    }
    publication.on('unsubscribed', track => trackUnsubscribed(participant, track));
  }

  function trackSubscribed(participant, track) {
    console.log(`LocalParticipant subscribed to RemoteParticipant "${participant.identity}"'s ${track.kind} Track ${track.sid}`);
    if (track.kind === 'audio' || track.kind === 'video') {

      //let newAudioElement = document.createElement("audio");
      //newAudioElement.setAttribute('id','audio_'+participant.sid);
      
      track.attach(`#${participant.sid} > ${track.kind}`);
    } else if (track.kind === 'data') {

      track.on('message', data => {
        console.log(JSON.parse(data));
      });
    }
  }

  function trackUnpublished(participant, publication) {
    console.log(`RemoteParticipant "${participant.identity}" unpublished ${publication.kind} Track ${publication.trackSid}`);
  }
  
  /**
   * Handle an unsubscribed Track.
   * @param {RemoteParticipant} participant
   * @param {Track} track
   * @returns {void}
   */
  function trackUnsubscribed(participant, track) {
    console.log(`LocalParticipant unsubscribed from RemoteParticipant "${participant.identity}"'s ${track.kind} Track ${track.sid}`);
    if (track.kind === 'audio' || track.kind === 'video') {
      track.detach();
    }

  }

  function participantDisconnected(participant){
    console.log(participant.identity + ' left the Room');
    participant.tracks.forEach(function(track) {
        // Remove the Participant's media container.
      $(`div#${participant.sid} > ${track.kind}`).remove();
       /*if (track.kind === 'audio' || track.kind === 'video'){
        const mediaElements = track.detach();
        
        mediaElements.forEach(function(mediaElement) {
          mediaElement.remove();
        });*/
      
  });
  
  }

  function roomDisconnected(room, error){
      console.log('Room Disconnection');
      if (error) {
        console.log('Unexpectedly disconnected:', error);
      }

      participantDisconnected(room.localParticipant, room);

      // Handle the disconnected RemoteParticipants.
      room.participants.forEach(participant => {
        participantDisconnected(participant, room);
      });

  }

  function diconectionsParticipant(participant){
    console.log(participant.identity,' just left')
  }