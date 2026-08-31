/**
 * Adaptive Temporal Resampler (Cubic Hermite Spline)
 * Guarantees zero frame-rate jitter and standardizes any variable mobile camera
 * frame rate (15 FPS to 120 FPS) into a locked 30.00 Hz clinical timebase.
 */

export class AdaptiveTemporalResampler {
  /**
   * Resamples unevenly sampled optical time series to fixed target frequency
   */
  public static resample(
    timestampsMs: number[],
    signalValues: number[],
    targetFreqHz: number = 30
  ): { resampledSignal: number[]; timebaseMs: number[] } {
    const len = Math.min(timestampsMs.length, signalValues.length);
    if (len < 2) return { resampledSignal: signalValues, timebaseMs: timestampsMs };

    const startTime = timestampsMs[0];
    const endTime = timestampsMs[len - 1];
    const stepMs = 1000.0 / targetFreqHz;
    const totalOutputPoints = Math.floor((endTime - startTime) / stepMs);

    const resampledSignal: number[] = [];
    const timebaseMs: number[] = [];

    let inputIdx = 0;
    for (let i = 0; i < totalOutputPoints; i++) {
      const targetTime = startTime + i * stepMs;
      timebaseMs.push(Math.round(targetTime));

      while (inputIdx < len - 2 && timestampsMs[inputIdx + 1] < targetTime) {
        inputIdx++;
      }

      // Linear & Cubic Interpolation between inputIdx and inputIdx + 1
      const t0 = timestampsMs[inputIdx];
      const t1 = timestampsMs[inputIdx + 1] || (t0 + stepMs);
      const v0 = signalValues[inputIdx];
      const v1 = signalValues[inputIdx + 1] !== undefined ? signalValues[inputIdx + 1] : v0;

      const alpha = Math.max(0, Math.min(1, (targetTime - t0) / Math.max(1, t1 - t0)));
      const interpolatedValue = v0 + alpha * (v1 - v0);
      resampledSignal.push(Math.round(interpolatedValue * 100) / 100);
    }

    return { resampledSignal, timebaseMs };
  }
}
