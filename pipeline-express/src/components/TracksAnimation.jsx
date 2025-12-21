import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import './TracksAnimation.css';

gsap.registerPlugin(MotionPathPlugin);

const TracksAnimation = () => {
    const containerRef = useRef(null);
    // Refs for trains
    const train1Ref = useRef(null);
    const train2Ref = useRef(null);
    const train3Ref = useRef(null);

    // Refs for secondary track trains
    const train4Ref = useRef(null);
    const train5Ref = useRef(null);

    useEffect(() => {
        const mainTrains = [train1Ref.current, train2Ref.current, train3Ref.current];
        const secondaryTrains = [train4Ref.current, train5Ref.current];

        // Animate main track trains
        mainTrains.forEach((train, index) => {
            gsap.to(train, {
                duration: 12,
                repeat: -1,
                ease: "none",
                delay: index * 4,
                motionPath: {
                    path: "#trackPath1",
                    align: "#trackPath1",
                    autoRotate: true,
                    alignOrigin: [0.5, 0.5]
                }
            });
        });

        // Animate secondary track trains (reverse direction or different speed)
        secondaryTrains.forEach((train, index) => {
            gsap.to(train, {
                duration: 15,
                repeat: -1,
                ease: "none",
                delay: index * 7,
                motionPath: {
                    path: "#trackPath2",
                    align: "#trackPath2",
                    autoRotate: true,
                    alignOrigin: [0.5, 0.5],
                    start: 1,
                    end: 0
                }
            });
        });

    }, []);

    // Helper to render a train group
    const renderTrain = (ref, id) => (
        <g ref={ref} id={id}>
            <rect x="-40" y="-12" width="80" height="24" rx="8" className="train-body" />
            <rect x="10" y="-8" width="20" height="16" rx="2" className="train-window" />
            <circle cx="35" cy="0" r="3" className="train-light" />
        </g>
    );

    return (
        <div className="tracks-animation-container" ref={containerRef}>
            <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">

                {/* Track 1: Sine Wave-ish */}
                <path
                    id="trackPath1"
                    className="track-path"
                    d="M-100,600 C300,600 500,200 900,200 S1500,600 1800,600"
                />
                {/* Visual Track 1 */}
                <path d="M-100,610 C300,610 500,210 900,210 S1500,610 1800,610" className="track-path" style={{ strokeOpacity: 0.3 }} />
                <path d="M-100,590 C300,590 500,190 900,190 S1500,590 1800,590" className="track-path" style={{ strokeOpacity: 0.3 }} />

                {/* Track 2: Crossing Wave */}
                <path
                    id="trackPath2"
                    className="track-path"
                    d="M-100,200 C300,200 500,600 900,600 S1500,200 1800,200"
                />
                {/* Visual Track 2 */}
                <path d="M-100,210 C300,210 500,610 900,610 S1500,210 1800,210" className="track-path" style={{ strokeOpacity: 0.3 }} />
                <path d="M-100,190 C300,190 500,590 900,590 S1500,190 1800,190" className="track-path" style={{ strokeOpacity: 0.3 }} />

                {/* Trains */}
                {renderTrain(train1Ref, "train1")}
                {renderTrain(train2Ref, "train2")}
                {renderTrain(train3Ref, "train3")}
                {renderTrain(train4Ref, "train4")}
                {renderTrain(train5Ref, "train5")}

            </svg>
        </div>
    );
};

export default TracksAnimation;
