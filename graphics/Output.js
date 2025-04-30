import Composer from "@/composer/index.js";

import Common from "@/Common";
import Powers from "@/components/Powers";

import Controls from "@/helpers/Controls";
import GridHelper from "@/helpers/GridHelper";

export default class {
  Components = {};
  Composers = {};
  helpers = {};

  constructor() {
    this.init();
  }

  init() {
    this.Components.powers = new Powers();

    this.helpers.controls = new Controls();
    // this.helpers.grid = new GridHelper(10, 10);

    this.composer = new Composer();
  }

  render(t) {
    Object.values(this.Components).forEach((component) => {
      if (typeof component.render === "function") {
        component.render(t);
      }
    });

    // Object.values(this.helpers).forEach((helper) => {
    //   if (typeof helper.render === "function") {
    //     helper.render(t);
    //   }
    // });

    // if (this.composer) {
    //   this.composer.render(t);
    // } else {

    Common.rendererManager.renderer.render(
      Common.sceneManager.scenes.main,
      Common.cameraManager.cameras.secondary,
    );
    // }
  }

  dispose() {
    Object.values(this.Components).forEach((component) => {
      if (typeof component.dispose === "function") {
        component.dispose();
      }
    });

    Object.values(this.helpers).forEach((helper) => {
      if (typeof helper.dispose === "function") {
        helper.dispose();
      }
    });
  }

  resize() {
    Object.values(this.Components).forEach((component) => {
      if (typeof component.resize === "function") {
        component.resize();
      }
    });

    Object.values(this.helpers).forEach((helper) => {
      if (typeof helper.resize === "function") {
        helper.resize();
      }
    });

    if (this.composer) {
      this.composer.resize();
    }
  }

  setDebug(pane) {
    Object.values(this.Components).forEach((component) => {
      if (typeof component.setDebug === "function") {
        component.setDebug(pane);
      }
    });
  }
}
