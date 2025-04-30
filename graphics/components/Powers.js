import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Uniform,
  Vector2,
} from "three";

import Common from "@/Common.js";
import Device from "@/pure/Device.js";

import MouseTrail from "@/components/preComponents/MouseTrail.js";
import ShadersManager from "../Managers/ShaderManager";
import gsap from "gsap";

export default class {
  PreComponents = {};
  Components = {};

  constructor() {
    this.init();
  }

  init() {
    this.ComponentsGroup = new Group();

    this.initPreComponents();
    this.initComponents();

    Object.keys(this.PreComponents).forEach((key) => {
      if (this.PreComponents[key].meshes) {
        this.ComponentsGroup.add(this.PreComponents[key].meshes);
      }
    });

    Object.keys(this.Components).forEach((key) => {
      // if (this.Components[key].meshes) {
      this.ComponentsGroup.add(this.Components[key]);
      // }
    });

    Common.sceneManager.scenes.main.add(this.ComponentsGroup);
  }

  // create precomponents
  createPreComponents() {
    this.PreComponents = { mouseTrail: new MouseTrail() };
  }

  // create components
  createComponents() {
    this.Components = {
      dummy: new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          uniforms: {
            uTime: new Uniform(0),

            // Colors
            uColor: new Uniform(new Color(0x4e5cff)),
            uBgColor: new Uniform(new Color(0x000cb0)),

            // Resolutions
            uResolution: new Uniform(new Vector2(0, 0)),
            uParisTexDimension: new Uniform(
              Common.resources.items.parisTexture.userData.dimension,
            ),
            uMontrealTexDimension: new Uniform(
              Common.resources.items.montrealTexture.userData.dimension,
            ),

            // Dithering
            uColorNum: new Uniform(8),
            uPixelSize: new Uniform(3),

            // Textures
            tMap: { value: null },
            tParisTex: {
              value: Common.resources.items.parisTexture,
            },
            tMontrealTex: {
              value: Common.resources.items.montrealTexture,
            },

            // Animation
            uTransition: new Uniform(0),
          },
          vertexShader: ShadersManager.get("components", "default", "vert"),
          fragmentShader: ShadersManager.get(
            "components",
            "ditheringFilter",
            "frag",
          ),
        }),
      ),
    };
  }

  // PreComponents
  initPreComponents() {
    this.createPreComponents();
    Object.keys(this.PreComponents).forEach((key) => {
      if (typeof this.PreComponents[key].init === "function")
        this.PreComponents[key].init();
    });
  }

  // Components
  initComponents() {
    this.createComponents();

    Object.keys(this.Components).forEach((key) => {
      if (typeof this.Components[key].init === "function")
        this.Components[key].init();
    });
  }

  dispose() {
    Object.keys(this.PreComponents).forEach((key) => {
      if (typeof this.PreComponents[key].dispose !== "function") return;
      this.PreComponents[key].dispose();
    });

    Object.keys(this.Components).forEach((key) => {
      if (typeof this.Components[key].dispose !== "function") return;
      this.Components[key].dispose();
    });

    Common.sceneManager.scenes.main.remove(this.ComponentsGroup);
    this.ComponentsGroup.removeFromParent();
    this.ComponentsGroup.clear();
    this.ComponentsGroup = null;
    this.Components = null;
    this.PreComponents = null;
    this.dispose = () => {};
  }

  render(t) {
    if (!this.Components.dummy) return;
    this.Components.dummy.material.uniforms.uTime.value = t * 0.001;

    Object.keys(this.PreComponents).forEach((key) => {
      if (typeof this.PreComponents[key].render !== "function") return;
      this.PreComponents[key].render(t);
    });

    Object.keys(this.Components).forEach((key) => {
      if (typeof this.Components[key].render !== "function") return;
      this.Components[key].render(t);
    });

    this.Components.dummy.material.uniforms.tMap.value =
      this.PreComponents.mouseTrail.target;
  }

  resize() {
    this.Components.dummy.material.uniforms.uResolution.value.set(
      Device.viewport.width * Device.pixelRatio,
      Device.viewport.height * Device.pixelRatio,
    );

    this.Components.dummy.scale.set(
      1 * (Device.viewport.width / Device.viewport.height),
      1,
      1,
    );

    Object.keys(this.PreComponents).forEach((key) => {
      if (typeof this.PreComponents[key].resize !== "function") return;
      this.PreComponents[key].resize();
    });

    Object.keys(this.Components).forEach((key) => {
      if (typeof this.Components[key].resize !== "function") return;
      this.Components[key].resize();
    });
  }

  setDebug(pane) {
    const debug = pane.addFolder({
      title: "Dithering",
      expanded: true,
    });

    debug
      .addBinding(this.Components.dummy.material.uniforms.uPixelSize, "value", {
        label: "pixel size",
        min: 0,
        max: 20,
        step: 2,
      })
      .on("change", () => {
        this.Components.dummy.material.uniforms.uColorNum.needsUpdate = true;
      });

    debug
      .addBinding(this.Components.dummy.material.uniforms.uColorNum, "value", {
        label: "color num",
        min: 0,
        max: 20,
        step: 1,
      })
      .on("change", () => {
        this.Components.dummy.material.uniforms.uColorNum.needsUpdate = true;
      });

    const animateBtn = debug.addButton({
      title: "Animate",
      label: "Animate",
    });

    animateBtn.on("click", () => {
      gsap.to(this.Components.dummy.material.uniforms.uTransition, {
        value: 1,
        duration: 5,
        ease: "power2.inOut",
      });
    });

    const resetBtn = debug.addButton({
      title: "Reset",
      label: "Reset",
    });

    resetBtn.on("click", () => {
      gsap.to(this.Components.dummy.material.uniforms.uTransition, {
        value: 0,
        duration: 5,
        ease: "power2.inOut",
      });
    });

    debug
      .addBinding(
        this.Components.dummy.material.uniforms.uTransition,
        "value",
        {
          label: "transition",
          min: 0,
          max: 1,
          step: 0.01,
        },
      )
      .on("change", () => {
        this.Components.dummy.material.uniforms.uTransition.needsUpdate = true;
      });
  }
}
