import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
}

export function InteractiveBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let particles: Particle[] = [];

        const colors = [
            'rgba(59, 130, 246, 0.4)',  // blue-500
            'rgba(147, 197, 253, 0.4)', // blue-300
            'rgba(37, 99, 235, 0.4)',   // blue-600
        ];

        // Initialize particles
        const initParticles = () => {
            particles = [];
            const particleCount = Math.floor((width * height) / 15000); // Density based on screen size

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 2 + 1, // Small specs 1-3px
                    vx: (Math.random() - 0.5) * 0.2, // Slow natural drift
                    vy: (Math.random() - 0.5) * 0.2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };

        initParticles();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw particles
            particles.forEach(p => {
                // Natural movement
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                // Mouse interaction (Repulsion/Antigravity effect)
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 200; // Interaction radius

                if (distance < maxDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (maxDistance - distance) / maxDistance;

                    // Push away from mouse (Antigravity)
                    const repulsionStrength = 2;
                    p.x -= forceDirectionX * force * repulsionStrength;
                    p.y -= forceDirectionY * force * repulsionStrength;
                }

                // Wrap around screen
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Draw shard/particle (small triangle/rect)
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;

                // Draw a small irregular shard shape
                ctx.beginPath();
                ctx.moveTo(-p.size, -p.size);
                ctx.lineTo(p.size, -p.size);
                ctx.lineTo(0, p.size * 1.5);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            });

            // Connect nearby particles (Optional constellation effect, keeping subtle)
            // Uncomment to add connection lines if desired, simpler is cleaner for "shards"

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }} // Subtle overlay
        />
    );
}
