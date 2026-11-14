import { GAUGE_IN_TUNE_ZONE, tuningGaugeReading } from '../tuningGauge';

describe('tuningGaugeReading', () => {
  it('afinado cae en el centro', () => {
    expect(tuningGaugeReading(0)).toEqual({ position: 0.5, overflow: null });
  });

  it('los extremos de la escala son ±50 cents', () => {
    expect(tuningGaugeReading(-50)).toEqual({ position: 0, overflow: null });
    expect(tuningGaugeReading(25).position).toBeCloseTo(0.75);
  });

  it('otra nota se pega al borde y dice hacia qué lado', () => {
    expect(tuningGaugeReading(-300)).toEqual({ position: 0, overflow: 'low' });
    expect(tuningGaugeReading(51)).toEqual({ position: 1, overflow: 'high' });
  });

  it('la zona afinada es ±25 cents', () => {
    expect(GAUGE_IN_TUNE_ZONE).toEqual([0.25, 0.75]);
  });
});
