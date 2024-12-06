// utils/confetti.js
import confetti from "canvas-confetti";

export function startAllAroundConfetti(duration = 10000) {
  const endTime = Date.now() + duration;

  const interval = setInterval(() => {
    if (Date.now() > endTime) {
      clearInterval(interval);
      return;
    }

    // Random angle and position for all-around effect
    const angle = Math.random() * 360;
    const originX = Math.random(); // random horizontal position
    const originY = Math.random(); // random vertical position

    confetti({
      particleCount: 50,
      startVelocity: 30,
      spread: 60,
      angle,
      origin: { x: originX, y: originY },
      zIndex: 9999,
    });
  }, 300);
}
