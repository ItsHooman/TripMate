import React, { useRef, useEffect } from "react";

const CanvasAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize balls
    const numBalls = 5;
    let balls = initializeBalls(numBalls, canvas.width, canvas.height);

    // Draw and animate bouncing balls
    function animate() {
      requestAnimationFrame(animate);
      drawBouncingBalls(ctx, balls, canvas.width, canvas.height);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      balls = initializeBalls(numBalls, canvas.width, canvas.height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-animation"></canvas>;
};

export default CanvasAnimation;

// Function to draw bouncing balls
function drawBouncingBalls(ctx, balls, width, height) {
  ctx.clearRect(0, 0, width, height);
  balls.forEach((ball) => {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce off walls
    if (ball.x < ball.radius || ball.x > width - ball.radius) ball.vx *= -1;
    if (ball.y < ball.radius || ball.y > height - ball.radius) ball.vy *= -1;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
  });
}

// Function to initialize balls
function initializeBalls(numBalls, width, height) {
  const balls = [];
  for (let i = 0; i < numBalls; i++) {
    balls.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 10 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: 'rgba(52, 10, 60, 0.8)' 
    });
  }
  return balls;
}
