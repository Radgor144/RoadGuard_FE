export const calculateEAR = (eye) => {
    if (!eye || eye.length !== 6) return 1.0;

    const euclideanDist = (p1, p2) =>
        Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const A = euclideanDist(eye[1], eye[5]);
    const B = euclideanDist(eye[2], eye[4]);
    const C = euclideanDist(eye[0], eye[3]);

    return (A + B) / (2.0 * C);
};
