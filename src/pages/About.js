export default function About() {
    return (
        <div className="about-container">
            <h1>About Road Guard</h1>


            <p className="about-intro">
                <strong>Road Guard</strong> is a driver safety application designed to monitor
                fatigue and loss of focus in real time using a camera and facial analysis.
                The system helps reduce accident risk by detecting drowsiness and alerting
                the driver immediately.
            </p>


            <section className="about-section">
                <h2>Real-time Monitoring</h2>
                <div className="about-content">
                    <img src="/images/screen_app.png" alt="Road Guard main panel" />
                    <div className="about-text">
                        <p>
                            The main panel provides live camera access and continuously tracks
                            eye activity using the Eye Aspect Ratio (EAR). A focus gauge shows
                            the driver’s alertness level in real time.
                        </p>
                        <p>
                            When prolonged eye closure or a critical focus drop is detected,
                            visual and sound alerts are triggered to encourage taking a break.
                        </p>
                    </div>
                </div>
            </section>


            <section className="about-section">
                <h2>Fatigue Statistics</h2>
                <div className="about-content">
                    <div className="about-text">
                        <p>
                            After each session, the statistics panel presents fatigue trends
                            over time, including a focus timeline chart and key summary values.
                        </p>
                        <p>
                            These insights help drivers understand fatigue patterns and plan
                            safer breaks during longer trips.
                        </p>
                    </div>
                    <img src="/images/screen_stats.png" alt="Road Guard statistics panel" />
                </div>
            </section>
        </div>
    );
}