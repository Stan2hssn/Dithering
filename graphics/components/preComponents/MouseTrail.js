import Input from "@/Input.js";
import Device from "@/pure/Device.js";
import Common from "@/Common.js";
import ShadersManager from "@/Managers/ShaderManager.js";

import FBO from "@/helpers/fbo/FBO.js";

import { Vector2, LinearFilter } from "three";

export default class MouseTrail {
  constructor() {
    this.Components = {};
  }

  createFBO({ width, height, debug }) {
    return new FBO({
      width,
      height,
      name: "trail",
      shader: ShadersManager.get("preComponents", "trail", "combine"),
      debug,
      uniforms: {
        tVelocity: { value: null },
        uOpacity: { value: 0 },
        uAspect: { value: 0 },
        uPointer: { value: new Vector2() },
        uVelocity: { value: new Vector2() },
        uSize: { value: 0.09999 },
        uTime: { value: 0 },
      },
      rtOptions: {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      },
    });
  }

  createVelocityFBO({ width, height, debug }) {
    return new FBO({
      width,
      height,
      name: "trail-velocity",
      shader: `precision highp float;
            uniform sampler2D texture;
            uniform vec2 uVelocity;
            void main () {
              vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;
              gl_FragColor = vec4(vec3(1., uVelocity * .25) + texture2D(texture, uv).rgb * 0.975, 1.);
            }
          `,
      debug,
      uniforms: {
        uVelocity: { value: new Vector2() },
      },
      rtOptions: {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      },
    });
  }

  render(t) {
    if (!this.fbo || !this.fboVelocity) return;

    this.fbo.render(Common.rendererManager.renderer);
    this.fboVelocity.render(Common.rendererManager.renderer);

    this.fboVelocity.uniforms.uVelocity.value.x = Input.delta.x;
    this.fboVelocity.uniforms.uVelocity.value.y = Input.delta.y;

    this.fbo.uniforms.tVelocity.value = this.fboVelocity.target;
    this.fbo.uniforms.uOpacity.value = Input.speedNormalized;
    this.fbo.uniforms.uSize.value =
      Math.abs(Input.speedNormalized - 1) * 0.09999;
    this.fbo.uniforms.uTime.value = t / 1000;
    this.fbo.uniforms.uPointer.value.set(
      Input.smoothCoords.x,
      Input.smoothCoords.y,
    );
  }

  get target() {
    return this.fbo?.target;
  }

  resize() {
    this.fbo?.dispose();
    this.fbo = this.createFBO({
      width: 128,
      height: 128,
      debug: Common?.debug,
    });

    this.fboVelocity?.dispose();
    this.fboVelocity = this.createVelocityFBO({
      width: 128,
      height: 128,
      debug: Common?.debug,
    });

    this.fbo.uniforms.uAspect.value =
      Device.viewport.width / Device.viewport.height;
  }
}
