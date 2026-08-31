/**
 * OmniTriage Live Smartphone Sensor Bridge v4.1
 * 100% Real Optical Camera & LED Torch Frame Extractor
 * High-Performance Hardware Synchronization for Mobile Web
 */

class SmartphoneSensorBridge {
  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.stream = null;
    this.isCameraActive = false;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.torchActive = false;
    this.onFrame = null;
    this.onImu = null;
    this.onAudio = null;
    this._rvfcId = null;
    this._rafId = null;
    this.isImuActive = false;
    this.audioCtx = null;
    this.audioStream = null;
  }

  async startCamera(onFrameCallback, facing = 'environment') {
    this.onFrame = onFrameCallback;
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 30, min: 24 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      const track = this.stream.getVideoTracks()[0];
      let torchEnabled = false;

      if (track && facing === 'environment') {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch || 'torch' in capabilities) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            torchEnabled = true;
            this.torchActive = true;
          } catch (torchErr) {
            console.warn('[SensorBridge] Torch constraint failed:', torchErr);
          }
        }
      }

      this.canvas.width = facing === 'user' ? 48 : 24;
      this.canvas.height = facing === 'user' ? 48 : 24;
      this.isCameraActive = true;
      this._scheduleNextFrame();

      return {
        success: true,
        torchActive: torchEnabled,
        cameraName: track ? track.label : (facing === 'user' ? 'Front Camera' : 'Rear Camera')
      };
    } catch (err) {
      console.warn('[SensorBridge] Camera initialization error:', err);
      return { success: false, error: err.message, torchActive: false };
    }
  }

  startImu(onImuCallback) {
    this.onImu = onImuCallback;
    this.isImuActive = true;
    if (typeof DeviceMotionEvent !== 'undefined') {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(state => {
          if (state === 'granted') window.addEventListener('devicemotion', this._handleMotion.bind(this));
        }).catch(console.warn);
      } else {
        window.addEventListener('devicemotion', this._handleMotion.bind(this));
      }
    }
  }

  _handleMotion(e) {
    if (!this.isImuActive || !this.onImu) return;
    const a = e.accelerationIncludingGravity || e.acceleration || { x: 0, y: 0, z: 0 };
    const r = e.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    this.onImu({
      ax: a.x || 0,
      ay: a.y || 0,
      az: a.z || 0,
      gx: r.alpha || 0,
      gy: r.beta || 0,
      gz: r.gamma || 0,
      ts: performance.now()
    });
  }

  stopImu() {
    this.isImuActive = false;
    window.removeEventListener('devicemotion', this._handleMotion.bind(this));
  }

  async startAudio(onAudioCallback) {
    this.onAudio = onAudioCallback;
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.audioStream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        if (!this.audioCtx) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        if (this.onAudio) this.onAudio({ energy: sum / dataArray.length, spectrum: dataArray, ts: performance.now() });
        requestAnimationFrame(checkAudio);
      };
      checkAudio();
      return { success: true };
    } catch (e) {
      console.warn('[SensorBridge] Audio initialization failed:', e);
      return { success: false, error: e.message };
    }
  }

  stopAudio() {
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
      this.audioStream = null;
    }
  }

  _scheduleNextFrame() {
    if (!this.isCameraActive) return;
    if ('requestVideoFrameCallback' in this.videoElement) {
      this._rvfcId = this.videoElement.requestVideoFrameCallback((now, metadata) => {
        this._processFrame(now);
        this._scheduleNextFrame();
      });
    } else {
      this._rafId = requestAnimationFrame(() => {
        this._processFrame(performance.now());
        this._scheduleNextFrame();
      });
    }
  }

  _processFrame(nowTs) {
    if (!this.isCameraActive) return;

    if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
      const W = this.canvas.width, H = this.canvas.height;
      this.ctx.drawImage(this.videoElement, 0, 0, W, H);
      const imageData = this.ctx.getImageData(0, 0, W, H);
      const data = imageData.data;

      let rSum = 0, gSum = 0, bSum = 0;
      const pixelCount = W * H;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      if (this.onFrame) {
        this.onFrame({
          r: rSum / pixelCount,
          g: gSum / pixelCount,
          b: bSum / pixelCount,
          timestamp: nowTs || performance.now()
        });
      }
    }
  }

  stopAll() {
    this.isCameraActive = false;
    if (this._rvfcId && 'cancelVideoFrameCallback' in this.videoElement) {
      try { this.videoElement.cancelVideoFrameCallback(this._rvfcId); } catch(e) {}
    }
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try {
          if (track.applyConstraints) {
            track.applyConstraints({ advanced: [{ torch: false }] });
          }
        } catch (e) {}
        track.stop();
      });
      this.stream = null;
    }
    this.torchActive = false;
    this.stopImu();
    this.stopAudio();
  }
}

window.SensorBridge = new SmartphoneSensorBridge();
