/**
 * OmniTriage Live Smartphone Sensor Bridge
 * Real-time camera optical frame extraction with torch support & microphone streaming.
 */

class SmartphoneSensorBridge {
  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.isCameraActive = false;
    this.isAudioActive = false;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.frameBuffer = [];
  }

  /**
   * Starts rear camera with LED Flash (Torch) on mobile devices
   */
  async startCamera(onFrameCallback) {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Enable torch/flashlight if supported by hardware
      const track = this.stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        try {
          await track.applyConstraints({ advanced: [{ torch: true }] });
        } catch (e) {
          console.warn('Torch activation not allowed:', e);
        }
      }

      this.canvas.width = 64;
      this.canvas.height = 64;
      this.isCameraActive = true;
      this._processFrames(onFrameCallback);
      return { success: true, torchSupported: !!capabilities.torch };
    } catch (err) {
      console.warn('Camera access error (falling back to precision simulation):', err);
      return { success: false, error: err.message };
    }
  }

  _processFrames(onFrameCallback) {
    if (!this.isCameraActive) return;

    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      let rSum = 0, gSum = 0, bSum = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;

      if (onFrameCallback) {
        onFrameCallback({ r: rAvg, g: gAvg, b: bAvg, timestamp: performance.now() });
      }
    }

    requestAnimationFrame(() => this._processFrames(onFrameCallback));
  }

  /**
   * Starts microphone audio stream for bioacoustic pulmonary analysis
   */
  async startMicrophone(onAudioFrameCallback) {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      source.connect(this.analyser);
      this.isAudioActive = true;

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const processAudio = () => {
        if (!this.isAudioActive) return;
        this.analyser.getByteFrequencyData(dataArray);
        if (onAudioFrameCallback) {
          onAudioFrameCallback(Array.from(dataArray));
        }
        requestAnimationFrame(processAudio);
      };
      processAudio();
      return { success: true };
    } catch (err) {
      console.warn('Microphone access error:', err);
      return { success: false, error: err.message };
    }
  }

  stopAll() {
    this.isCameraActive = false;
    this.isAudioActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
window.SmartphoneSensorBridge = SmartphoneSensorBridge;
