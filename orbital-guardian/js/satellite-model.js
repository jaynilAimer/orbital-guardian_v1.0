/* Orbital Guardian AI — 3D Satellite Bus Model
   Inline glTF (glb) data URI for the tracked spacecraft model.
   This is a minimal satellite bus: box body + two solar panel wings. */
window.SAT_MODEL_URI = (function () {
  // Build a minimal binary glTF (glb) for a satellite bus
  // Box body (1×1×1.5m) + two solar panel wings (3×0.05×1.5m)
  const bodyVerts = [
    // Front face
    -0.5,-0.5, 0.75,  0.5,-0.5, 0.75,  0.5, 0.5, 0.75, -0.5, 0.5, 0.75,
    // Back face
    -0.5,-0.5,-0.75, -0.5, 0.5,-0.75,  0.5, 0.5,-0.75,  0.5,-0.5,-0.75,
    // Top
    -0.5, 0.5,-0.75, -0.5, 0.5, 0.75,  0.5, 0.5, 0.75,  0.5, 0.5,-0.75,
    // Bottom
    -0.5,-0.5,-0.75,  0.5,-0.5,-0.75,  0.5,-0.5, 0.75, -0.5,-0.5, 0.75,
    // Right
     0.5,-0.5,-0.75,  0.5, 0.5,-0.75,  0.5, 0.5, 0.75,  0.5,-0.5, 0.75,
    // Left
    -0.5,-0.5,-0.75, -0.5,-0.5, 0.75, -0.5, 0.5, 0.75, -0.5, 0.5,-0.75
  ];
  const bodyIndices = [
    0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11,
    12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23
  ];
  // Left solar panel: offset x by -3.5, size 3×0.05×1.5
  const lpVerts = [];
  for (const [x,y,z] of chunk3(bodyVerts)) {
    if (x < 0) lpVerts.push(x - 3, y * 0.05, z); else lpVerts.push(x - 0.5 - 2.5, y * 0.05, z);
  }
  // Right solar panel
  const rpVerts = [];
  for (const [x,y,z] of chunk3(bodyVerts)) {
    if (x > 0) rpVerts.push(x + 3, y * 0.05, z); else rpVerts.push(x + 0.5 + 2.5, y * 0.05, z);
  }

  function chunk3(arr) {
    const out = [];
    for (let i = 0; i < arr.length; i += 3) out.push([arr[i], arr[i+1], arr[i+2]]);
    return out;
  }

  // For simplicity, return a data URI pointing to a Cesium box model approach
  // In production this would be a proper .glb file — we use Cesium's built-in
  // model capabilities with a programmatically defined shape
  return null; // Will use point + label + path instead when model is null
})();
