import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import styles from './Cursor.module.css';

const SPRING = { damping: 26, stiffness: 300, mass: 0.5 };
const SPRING_SLOW = { damping: 28, stiffness: 180, mass: 0.8 };

export function Cursor() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [label, setLabel]     = useState('');
  const [clicking, setClicking] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const dotX  = useSpring(mouseX, SPRING);
  const dotY  = useSpring(mouseY, SPRING);
  const ringX = useSpring(mouseX, SPRING_SLOW);
  const ringY = useSpring(mouseY, SPRING_SLOW);

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);

      // detect what we're hovering
      const el = e.target;
      const interactive = el.closest('button, a, input, select, textarea, [role="button"], [tabindex]');
      setHovered(!!interactive);
      setLabel(interactive?.getAttribute('title') || interactive?.getAttribute('aria-label') || '');
    };

    const down = () => setClicking(true);
    const up   = () => setClicking(false);
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    document.documentElement.addEventListener('mouseleave', leave);
    document.documentElement.addEventListener('mouseenter', enter);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
      document.documentElement.removeEventListener('mouseenter', enter);
    };
  }, [visible, mouseX, mouseY]);

  if (!visible) return null;

  return (
    <>
      {/* Dot — snaps exactly */}
      <motion.div
        className={`${styles.dot} ${hovered ? styles.dotHovered : ''} ${clicking ? styles.dotClicking : ''}`}
        style={{ x: dotX, y: dotY }}
      />

      {/* Ring — spring lag */}
      <motion.div
        className={`${styles.ring} ${hovered ? styles.ringHovered : ''} ${clicking ? styles.ringClicking : ''}`}
        style={{ x: ringX, y: ringY }}
      >
        {label && hovered && (
          <motion.span
            className={styles.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {label.length > 20 ? label.slice(0, 20) + '…' : label}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
