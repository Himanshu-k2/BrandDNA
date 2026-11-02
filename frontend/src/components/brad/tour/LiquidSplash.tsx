import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Droplet {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

interface LiquidSplashProps {
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

export function LiquidSplash({ active, onComplete, className = '' }: LiquidSplashProps) {
  const [droplets, setDroplets] = useState<Droplet[]>([]);

  useEffect(() => {
    if (!active) {
      setDroplets([]);
      return;
    }

    // Generate dynamic splash droplet particles erupting outward
    const particles: Droplet[] = Array.from({ length: 12 }, (_, i) => {
      // Erupt upwards between -35deg and -145deg
      const angle = ((-35 - (i * 100) / 11) * Math.PI) / 180;
      const velocity = 35 + Math.random() * 45; // 35px - 80px distance
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;
      const size = 3 + Math.random() * 4.5;
      const delay = Math.random() * 0.06;
      const duration = 0.55 + Math.random() * 0.25;
      // Droplets have warm BrandDNA amber/white liquid reflections
      const color = i % 3 === 0 ? 'bg-brand-orange' : i % 2 === 0 ? 'bg-white' : 'bg-brand-orange/70';

      return { id: i, x, y, size, delay, duration, color };
    });

    setDroplets(particles);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  return (
    <div className={`pointer-events-none absolute inset-0 z-50 flex items-center justify-center ${className}`}>
      <AnimatePresence>
        {active && (
          <>
            {/* Concentric expanding liquid ripple wave 1 */}
            <motion.div
              key="ripple-1"
              initial={{ scale: 0.4, opacity: 0.95, borderWidth: '3px' }}
              animate={{ scale: 2.4, opacity: 0, borderWidth: '0.5px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute size-14 rounded-full border border-brand-orange shadow-[0_0_15px_rgba(255,69,0,0.5)]"
            />

            {/* Concentric expanding liquid ripple wave 2 */}
            <motion.div
              key="ripple-2"
              initial={{ scale: 0.2, opacity: 0.8, borderWidth: '2.5px' }}
              animate={{ scale: 3.1, opacity: 0, borderWidth: '0.5px' }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="absolute size-14 rounded-full border border-white/90 shadow-[0_0_20px_rgba(255,255,255,0.8)]"
            />

            {/* Central liquid burst glow */}
            <motion.div
              key="burst-glow"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute size-12 rounded-full bg-gradient-to-r from-brand-orange/40 via-white/80 to-brand-orange/30 blur-md"
            />

            {/* Droplets fountain */}
            {droplets.map(d => (
              <motion.span
                key={`droplet-${d.id}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: d.x,
                  y: [0, d.y * 1.15, d.y + 16], // Upward arc with gravity pull
                  scale: [0, 1.2, 0.6, 0],
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: d.duration,
                  delay: d.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ width: d.size, height: d.size }}
                className={`absolute rounded-full shadow-sm ring-1 ring-white/60 ${d.color}`}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

