import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaDownload, FaVideoSlash, FaChevronRight } from 'react-icons/fa';
import Webcam from 'react-webcam';
import { saveAs } from 'file-saver';
import axios from 'axios';
import RecordRTC from "recordrtc"
import Chart from 'chart.js/auto';

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
  const [clickedButton, setClickedButton] = useState(null);
  const [heartRateReceived, setHeartRateReceived] = useState(false);



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
        setHeartRateReceived(true);
      }
    } catch (error) {
      console.error('Error sending video to the backend:', error);
    }
  };

  //plotting chart
  const rppgDataRef = useRef(null);

  useEffect(() => {
    if (rppgDataRef.current) {
      rppgDataRef.current.destroy();
    }
    // Create a chart once when the component mounts
    rppgDataRef.current = new Chart('rppg-chart', {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'RPPG Signal',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }, []);

  useEffect(() => {
    if (rppgSignals) {
      // Update the RPPG data in the chart when new data is received
      rppgDataRef.current.data.labels = Array.from(Array(rppgSignals.length).keys());
      rppgDataRef.current.data.datasets[0].data = rppgSignals;
      rppgDataRef.current.update();
    }
  }, [rppgSignals]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row', margin: '5px' }}>
        <button
          style={{
            backgroundColor: clickedButton === 'startRecording' ? '#0a58ca' : '#0073e6',
            color: 'white',
            padding: '10px',
            marginRight: '5px',
            transition: 'background-color 0.3s',
          }}
          onClick={() => {
            startRecording();
            setClickedButton('startRecording');
            setTimeout(() => setClickedButton(null), 300);
          }}
        >
          <FaCamera /> Start Recording
        </button>
        <button
          style={{
            backgroundColor: clickedButton === 'stopRecording' ? '#0a58ca' : '#0073e6',
            color: 'white',
            padding: '10px',
            marginRight: '5px',
            transition: 'background-color 0.3s',
          }}
          onClick={() => {
            stopRecording();
            setClickedButton('stopRecording');
            setTimeout(() => setClickedButton(null), 300);
          }}
          disabled={!recorder}
        >
          <FaVideoSlash /> Stop Recording
        </button>
        <button
          style={{
            backgroundColor: clickedButton === 'downloadVideo' ? '#0a58ca' : '#0073e6',
            color: 'white',
            padding: '10px',
            transition: 'background-color 0.3s',
          }}
          onClick={() => {
            downloadVideo();
            setClickedButton('downloadVideo');
            setTimeout(() => setClickedButton(null), 300);
          }}
          disabled={!videoBlob}
        >
          <FaDownload /> Download Video
        </button>
        <button
          style={{
            backgroundColor: clickedButton === 'sendVideoToBackend' ? '#0a58ca' : '#0073e6',
            color: 'white',
            padding: '10px',
            transition: 'background-color 0.3s',
            marginLeft: '10px'
          }}
          onClick={() => {
            sendVideoToBackend();
            setClickedButton('sendVideoToBackend');
            setTimeout(() => setClickedButton(null), 300);
          }}
          disabled={!videoBlob}
        >
          <FaChevronRight /> Get rppg signals
        </button>

      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '5px' }}>
        <div style={{ background: 'white', borderRadius: '10px', padding: '5px', fontSize: '20px', fontWeight: 'bold', marginRight: '5px', marginTop: '10px' }}>
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
        {heartRateReceived && (
          <div style={{ marginTop: '10px' }}>
            Heart Rate: {heartRate}
          </div>
        )}
        <canvas id="rppg-chart" width="500" height="200"></canvas>
      </div>
    </div >
  );
}

export default App;
