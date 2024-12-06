// components/common/BirthdayEasterEgg.js
import { useEffect, useRef, useState } from "react";
import { Fireworks } from "fireworks-js";
import { startAllAroundConfetti } from "../../utils/confetti";
import styles from "./BirthdayEasterEgg.module.css";

const birthdays = [
  { name: "Bishal", date: new Date(new Date().getFullYear(), 11, 5) },   // Dec 2
  { name: "Bob", date: new Date(new Date().getFullYear(), 5, 15) },     // Jun 15
  { name: "Charlie", date: new Date(new Date().getFullYear(), 8, 23) }, // Sep 23
];

const CELEBRATION_DURATION = 10000; // 10 seconds

const BirthdayEasterEgg = () => {
  const [celebrate, setCelebrate] = useState(false);
  const [birthdayName, setBirthdayName] = useState(null);
  const fireworksRef = useRef(null);
  const fireworksInstance = useRef(null);

  useEffect(() => {
    const today = new Date();
    const match = birthdays.find(
      (b) =>
        today.getDate() === b.date.getDate() &&
        today.getMonth() === b.date.getMonth()
    );

    if (match) {
      setBirthdayName(match.name);
      setCelebrate(true);
    }
  }, []);

  useEffect(() => {
    // Only run if celebrate is true and the ref is available
    if (celebrate && fireworksRef.current) {
      // Start fireworks
      fireworksInstance.current = new Fireworks(fireworksRef.current, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.02,
        friction: 0.98,
        gravity: 1.0,
        particles: 150,
        traceLength: 5,
        explosion: 5,
        intensity: 30,
      });
      fireworksInstance.current.start();

      // Start confetti bursts
      startAllAroundConfetti(CELEBRATION_DURATION);

      // Stop after duration
      const timer = setTimeout(() => {
        if (fireworksInstance.current) {
          fireworksInstance.current.stop();
        }
        setCelebrate(false);
      }, CELEBRATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [celebrate]);

  if (!celebrate) return null;

  return (
    <div className={styles.overlay}>
      {/* This div is the container where fireworks-js will append its canvas */}
      <div ref={fireworksRef} className={styles.fireworksContainer}></div>
      <div className={styles.message}>
        🎉 Happy Birthday, {birthdayName}! 🎂 🎊
      </div>
    </div>
  );
};

export default BirthdayEasterEgg;
