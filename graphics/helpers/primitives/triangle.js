import { BufferAttribute, BufferGeometry } from "three";

const vertices = new Float32Array([
  -1.0, -1.0, 0.0, 3.0, -1.0, 0.0, -1.0, 3.0, 0.0,
]);
const uv = new Float32Array([0, 0, 2, 0, 0, 2]);
const geometry = new BufferGeometry();
geometry.setAttribute("position", new BufferAttribute(vertices, 3));
geometry.setAttribute("uv", new BufferAttribute(uv, 2));
export default geometry;
