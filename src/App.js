import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaDownload, FaVideoSlash, FaChevronRight } from 'react-icons/fa';
import Webcam from 'react-webcam';
import { saveAs } from 'file-saver';
import axios from 'axios';
import RecordRTC from "recordrtc"

function App() {
  const [recorder, setRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [videoBlob, setVideoUrlBlob] = useState(null);
  const [type, setType] = useState('video');
  const [countDown, setCountDown] = useState(30);
  const refCountDown = useRef(30);
  const webcamRef = useRef(null);
  const intervalId = useRef(null);
  const coutdownIntervalId = useRef(null);
  const [heartRate, setHeartRate] = useState(null);
  const [rppgSignals, setRPPGSignals] = useState(null);

  useEffect(() => {
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }

      if (coutdownIntervalId.current) {
        clearInterval(coutdownIntervalId.current);
      }
    };
  }, []);

  const startRecording = async () => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })
      .then(async function (stream) {
        let recorder = RecordRTC(stream, {
          type: 'video'
        });
        recorder.startRecording();

        coutdownIntervalId.current = setInterval(() => {
          setCountDown((prevCount) => prevCount - 1);
          refCountDown.current -= 1;
          if (refCountDown.current === 0) {
            stopRecording();
          }
        }, 1000);

        setRecorder(recorder);
        setStream(stream);
        setVideoUrlBlob(null);

        console.log('Recorder:', recorder); // Add this line to check the recorder
      })
  }


  const stopRecording = async () => {
    if (recorder) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      if (coutdownIntervalId.current) {
        clearInterval(coutdownIntervalId.current);
      }

      console.log('Recording stopped');

      setCountDown(30);
      refCountDown.current = 30;

      try {
        await recorder.stopRecording(function () {
          const blob = recorder.getBlob();
          console.log(blob);

          stream.getTracks().forEach((track) => track.stop());

          setVideoUrlBlob(blob);
          setStream(null);
          setRecorder(null);
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };


  const downloadVideo = () => {
    if (videoBlob) {
      const mp4File = new File([videoBlob], 'demo.mp4', { type: 'video/mp4' });
      saveAs(mp4File, `Video-${Date.now()}.mp4`);
    }
  };

  const sendVideoToBackend = async () => {
    console.log('clicked');
    try {
      if (videoBlob) {
        const formData = new FormData();
        formData.append('video', videoBlob);

        const response = await axios.post('http://localhost:5000/upload-video', formData);

        console.log('Response from server:', response.data);
        setHeartRate(response.data.heartRate);
        setRPPGSignals(response.data.rppgSignals);
      }
    } catch (error) {
      console.error('Error sending video to the backend:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row', margin: '5px' }}>
        <button
          style={{ backgroundColor: '#0073e6', color: 'white', padding: '10px', marginRight: '5px' }}
          onClick={startRecording}
        >
          <FaCamera /> Start Recording
        </button>
        <button
          style={{ backgroundColor: '#0073e6', color: 'white', padding: '10px', marginRight: '5px' }}
          onClick={stopRecording}
          disabled={!recorder}
        >
          <FaVideoSlash /> Stop Recording
        </button>
        <button
          style={{ backgroundColor: '#0073e6', color: 'white', padding: '10px', marginRight: '5px' }}
          onClick={downloadVideo}
          disabled={!videoBlob}
        >
          <FaDownload /> Download Video
        </button>
        <button
          style={{ backgroundColor: '#0073e6', color: 'white', padding: '10px' }}
          onClick={sendVideoToBackend}
          disabled={!videoBlob}
        >
          <FaChevronRight /> Send Video
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '5px' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '5px', fontSize: '20px', fontWeight: 'bold', marginRight: '5px' }}>
          Remaining time: {countDown} seconds
        </div>
        <div style={{ width: '500px', height: '500px' }}>
          {!videoBlob ? (
            <Webcam
              width={500}
              height={500}
              mirrored={false}
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
            />
          ) : (
            <video width={500} height={500} src={window.URL.createObjectURL(videoBlob)} controls />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
