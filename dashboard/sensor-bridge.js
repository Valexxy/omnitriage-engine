/**
 * OmniTriage Live Smartphone Sensor Bridge
 * Real-time camera optical frame extraction with hardware torch support & microphone streaming.
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
    this.torchActive = false;
    this.onFrame = null;
  }

  /**
   * Starts rear camera with LED Flash (Torch) on mobile devices
   */
  async startCamera(onFrameCallback) {
    this.onFrame = onFrameCallback;
    try {
      // 1. Request environment rear camera with maximum frame rate
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

      // 2. Locate video track and engage physical LED Torch / Flashlight
      const track = this.stream.getVideoTracks()[0];
      let torchEnabled = false;

      if (track) {
        // Method A: Check capabilities
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch || 'torch' in capabilities) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            torchEnabled = true;
            this.torchActive = true;
          } catch (torchErr) {
            console.warn('[SensorBridge] Direct torch constraint failed, trying fallback:', torchErr);
          }
        }

        // Method B: Try applyConstraints directly even if capabilities were hidden
        if (!torchEnabled && track.applyConstraints) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            torchEnabled = true;
            this.torchActive = true;
          } catch (e) {
            console.info('[SensorBridge] Hardware torch not accessible in this browser (iOS/Sandbox).');
          }
        }
      }

      this.canvas.width = 64;
      this.canvas.height = 64;
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
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;

      if (this.onFrame) {
        this.onFrame({ r: rAvg, g: gAvg, b: bAvg, timestamp: performance.now() });
      }
    }

    requestAnimationFrame(() => this._processFrames());
  }

  stopAll() {
    this.isCameraActive = false;
    this.isAudioActive = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        // Turn off torch before stopping
        try {
          if (track.applyConstraints) {
            track.applyConstraints({ advanced: [{ torch: false }] });
          }
        } catch (e) {}
        track.stop();
      });
      this.stream = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    this.torchActive = false;
  }
}

// Global Sensor Bridge Singleton
window.SensorBridge = new SmartphoneSensorBridge();
