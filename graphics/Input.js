import gsap from "gsap";
import Device from "@/pure/Device";
import { Vector2 } from "three";

class Input {
  constructor() {
    this.coords = new Vector2();
    this.smoothCoords = new Vector2();

    this.delta = new Vector2();
    this.speed = 0;
    this.speedNormalized = 0;
    this.VelocityX = 0;
    this.VelocityY = 0;

    this.mouseMovedX = false;
    this.mouseMovedY = false;

    this.prevCoords = new Vector2();

    this.timer = null;
    this.count = 0;
  }

  init() {
    this.initSmooth();

    document.addEventListener(
      "mousemove",
      this.onDocumentMouseMove.bind(this),
      false,
    );
    document.addEventListener(
      "touchstart",
      this.onDocumentTouchStart.bind(this),
      { passive: false }, // Mark the listener as non-passive
    );
    document.addEventListener(
      "touchmove",
      this.onDocumentTouchMove.bind(this),
      { passive: false }, // Mark the listener as non-passive
    );
  }

  initSmooth() {
    this.coordsToX = gsap.quickTo(this.smoothCoords, "x", {
      duration: 0.4,
      ease: "linear",
      onStart: () => {
        this.mouseMovedX = true;
      },
      onComplete: () => {
        this.mouseMovedX = false;
      },
      onUpdate: () => {
        this.delta.x = this.getTravel(this.smoothCoords.x - this.prevCoords.x);

        this.VelocityX = gsap.utils.mapRange(
          -1,
          1,
          -Device.viewport.width / 2,
          Device.viewport.width / 2,
        )(this.delta.x);
      },
    });
    this.coordsToY = gsap.quickTo(this.smoothCoords, "y", {
      duration: 0.4,
      ease: "linear",
      onStart: () => {
        this.mouseMovedY = true;
      },
      onComplete: () => {
        this.mouseMovedY = false;
      },
      onUpdate: () => {
        this.delta.y = this.getTravel(this.smoothCoords.y - this.prevCoords.y);

        this.VelocityY = gsap.utils.mapRange(
          -1,
          1,
          -Device.viewport.height / 2,
          Device.viewport.height / 2,
        )(this.delta.y);

        this.speed = Math.max(Math.abs(this.delta.x), Math.abs(this.delta.y));
        this.speedNormalized = gsap.utils.clamp(0, 1, this.speed);
      },
    });
  }

  getTravel(value) {
    return Math.round(value * 100) / 100;
  }

  setCoords(x, y) {
    if (this.timer) clearTimeout(this.timer);
    this.coords.set(
      x / Device.viewport.width,
      -(y / Device.viewport.height) + 1,
    );

    this.coordsToX(this.coords.x);
    this.coordsToY(this.coords.y);

    this.prevCoords.copy(this.coords);
  }

  onDocumentMouseMove(event) {
    this.setCoords(event.clientX, event.clientY);
  }

  onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.setCoords(event.touches[0].pageX, event.touches[0].pageY);
    }
  }

  onDocumentTouchMove(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.setCoords(event.touches[0].pageX, event.touches[0].pageY);
    }
  }

  render() {
    if (this.prevCoords.x === 0 && this.prevCoords.y === 0)
      this.delta.set(0, 0);
  }

  dispose() {}

  resize() {}
}

export default new Input();
