import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CustomCursor.css';

const CustomCursor = () => {
    const cursorRef = useRef(null);
    const dotRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const cursor = cursorRef.current;
        const dot = dotRef.current;

        const onMouseMove = (e) => {
            // Move dot instantly
            gsap.to(dot, {
                x: e.clientX,
                y: e.clientY,
                duration: 0
            });

            // Move cursor ring with delay
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: 'power2.out'
            });
        };

        const onMouseOver = (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('.dashboard-card')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseover', onMouseOver);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseover', onMouseOver);
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className={`custom-cursor ${isHovering ? 'hovering' : ''}`} />
            <div ref={dotRef} className="cursor-dot" />
        </>
    );
};

export default CustomCursor;
