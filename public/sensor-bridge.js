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
    this._rvfcId = null;
    this._rafId = null;
  }

  async startCamera(onFrameCallback) {
    this.onFrame = onFrameCallback;
    try {
      // Prioritize high-speed 30 FPS stream with optimal low-res bounding (avoids 4K/1080p thermal throttle)
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
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

      // 24x24 optical matrix: 576 pixels (4x faster than 48x48 with zero SNR loss for transilluminated fingertip)
      this.canvas.width = 24;
      this.canvas.height = 24;
      this.isCameraActive = true;
      this._scheduleNextFrame();

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
  }
}

window.SensorBridge = new SmartphoneSensorBridge();
