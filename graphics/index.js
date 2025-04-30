import Common from "@/Common";
import Output from "@/Output";
import Input from "@/Input";

import Stats from "stats.js";

export default class {
  constructor({ canvas }) {
    Input.init();
    Common.init({ canvas });

    this.render = this.render.bind(this);

    Common.resources.on("assetsLoaded", () => {
      this.output = new Output();

      const href = window.location.hash;

      if (href === "#debug") {
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.stats.showPanel(0);

        Common.initPane();
        this.output.setDebug(Common.pane);
      }

      this.init();
      this.render();
    });

    Common.loadAssets();
  }

  init() {
    this.resize();
    this.x = this.resize.bind(this);

    window.addEventListener("resize", this.x, false);
  }

  render(t) {
    if (this.stats) this.stats.begin();
    requestAnimationFrame(this.render.bind(this));
    Input.render(t);
    Common.render(t);
    this.output.render(t);
    if (this.stats) this.stats.end();
  }

  resize() {
    Input.resize();
    Common.resize();
    this.output.resize();
  }

  destroy() {
    window.removeEventListener("resize", this.x);

    Input.dispose();
    Common.dispose();
    this.output.dispose();
  }
}
