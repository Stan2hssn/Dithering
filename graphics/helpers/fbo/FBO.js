import {
  Camera,
  DataTexture,
  Mesh,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  WebGLRenderTarget,
  NearestFilter,
  FloatType,
} from "three";

import triangle from "@/helpers/primitives/triangle.js";

const type = FloatType;

export default class FBO {
  constructor({
    width,
    height,
    data,
    name,
    shader,
    texture,
    uniforms = {},
    rtOptions = {},
    debug = false,
  }) {
    const opts = arguments[0];
    this.options = opts;

    this.camera = new Camera();
    this.scene = new Scene();
    this.scene.background = 0x000000;

    this.index = 0;
    this.copyData = true;

    this.texture =
      texture ||
      new DataTexture(
        data || new Float32Array(width * height * 4),
        width,
        height,
        RGBAFormat,
        type,
      );
    this.texture.needsUpdate = true;

    this.rt = [this.createRT(), this.createRT()];

    this.material = new RawShaderMaterial({
      name: name || "FBO",
      defines: {
        RESOLUTION: `vec2(${width.toFixed(1)}, ${height.toFixed(1)})`,
      },
      uniforms: {
        ...uniforms,
        texture: {
          value: this.texture,
        },
      },
      vertexShader: `
            precision highp float;
            attribute vec3 position;
            void main() {
              gl_Position = vec4(position, 1.0);
            }
          `,
      fragmentShader:
        shader ||
        `
            precision highp float;
            uniform sampler2D texture;
            void main() {
              vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;
              gl_FragColor = texture2D(texture, uv);
              gl_FragColor = vec4(vec3(0.5), 1.);
            }
          `,
    });

    this.mesh = new Mesh(triangle, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  dispose() {
    this.target?.dispose();
    this.texture?.dispose();
    this.rt[0]?.dispose();
    this.rt[1]?.dispose();
    this.material?.uniforms.texture.value.dispose();
    this.material?.uniforms.textureDefaultPosition?.value?.dispose();
    this.material?.dispose();
    this.scene.remove(this.mesh);
  }

  createRT() {
    return new WebGLRenderTarget(
      this.options.width,
      this.options.height,
      Object.assign(
        {
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          stencilBuffer: false,
          depthBuffer: false,
          depthWrite: false,
          depthTest: false,
          type,
        },
        this.options.rtOptions,
      ),
    );
  }

  get uniforms() {
    return this.material.uniforms;
  }

  get target() {
    return this.rt[this.index].texture;
  }

  render = (renderer, switchBack = true) => {
    renderer.setRenderTarget(this.rt[this.index]);
    renderer.render(this.scene, this.camera);

    this.material.uniforms.texture.value = this.rt[this.index].texture;
    this.material.uniforms.texture.value.needsUpdate = true;

    renderer.setRenderTarget(null);
    this.index = this.index === 0 ? 1 : 0;
    this.copyData = false;
  };
}
