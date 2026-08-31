/**
 * OmniTriage Live Smartphone Sensor Bridge
 * 100% Real Optical Camera & LED Torch Frame Extractor
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
  }

  async startCamera(onFrameCallback) {
    this.onFrame = onFrameCallback;
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

      const track = this.stream.getVideoTracks()[0];
      let torchEnabled = false;

      if (track) {
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

        if (!torchEnabled && track.applyConstraints) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            torchEnabled = true;
            this.torchActive = true;
          } catch (e) {}
        }
      }

      this.canvas.width = 48;
      this.canvas.height = 48;
      this.isCameraActive = true;
      this._processFrames();

      return {
        success: true,
        torchActive: torchEnabled,
        cameraName: track ? track.label : 'Rear Camera'
      };
    } catch (err) {
      console.warn('[SensorBridge] Camera initialization error:', err);
      return { success: false, error: err.message, torchActive: false };
    }
  }

  _processFrames() {
    if (!this.isCameraActive) return;

    if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      let rSum = 0, gSum = 0, bSum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const rAvg = rSum / pixelCount;
      const gAvg = gSum / pixelCount;
      const bAvg = bSum / pixelCount;

      if (this.onFrame) {
        this.onFrame({ r: rAvg, g: gAvg, b: bAvg, timestamp: performance.now() });
      }
    }

    requestAnimationFrame(() => this._processFrames());
  }

  stopAll() {
    this.isCameraActive = false;
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
  }
}

window.SensorBridge = new SmartphoneSensorBridge();
