import { PerspectiveCamera, OrthographicCamera, Vector3 } from "three";

import Device from "@/pure/Device";

class CameraManager {
  constructor(params) {
    this.params = params;
    this.cameras = {};

    this.activeCamera = null;
  }

  getPerspectiveCamera() {
    return new PerspectiveCamera(
      this.params.cameraFov,
      Device.viewport.width / Device.viewport.height,
      this.params.cameraNear,
      this.params.cameraFar,
    );
  }

  getOrthographicCamera() {
    return new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  }

  createCamera({
    type = "perspective",
    name = "main",
    position = new Vector3(0, 0, 0),
    lookAt = new Vector3(0, 0, 0),
  }) {
    let camera;
    if (type === "perspective") {
      camera = this.getPerspectiveCamera();
    } else {
      console.log("Creating orthographic camera");

      camera = this.getOrthographicCamera();
    }

    camera.position.copy(position);
    camera.lookAt(lookAt);

    this.cameras[name] = camera;
    camera.name = name;

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    return camera;
  }

  setCameras() {
    this.main = this.createCamera({
      type: "perspective",
      name: "main",
      position: new Vector3(0, 0, 4),
      lookAt: new Vector3(0, 0, 0),
    });
    this.activeCamera = this.cameras.main;

    this.secondary = this.createCamera({
      type: "orthographic",
      name: "secondary",
      position: new Vector3(0, 0, 2),
      lookAt: new Vector3(0, 0, 0),
    });
  }

  render(t) {}

  resizeCamera(camera, position, lookAt, aspect) {
    if (!camera) return;

    if (camera.isPerspectiveCamera) {
      camera.aspect = aspect;
    } else if (camera.isOrthographicCamera) {
      const frustumSize = 1;
      camera.left = (-frustumSize * aspect) / 2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
    }

    this.setCameraPosition(camera, position);
    this.setCameraLookAt(camera, lookAt);

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
  }

  setCameraPosition(camera, position) {
    if (position) {
      if (position instanceof Vector3) {
        camera.position.copy(position);
      } else {
        camera.position.set(position.x, position.y, position.z);
      }
    }
  }

  setCameraLookAt(camera, lookAt) {
    if (lookAt) {
      if (lookAt instanceof Vector3) {
        camera.lookAt(lookAt);
      } else {
        camera.lookAt(new Vector3(lookAt.x, lookAt.y, lookAt.z));
      }
    }
  }

  resize(aspect) {
    Object.values(this.cameras).forEach((camera) => {
      this.resizeCamera(camera, null, null, aspect);
    });
  }

  dispose() {
    Object.values(this.cameras).forEach((camera) => {
      camera = null;
    });
    this.cameras = {};
  }

  setDebug(debug) {}
}

export default CameraManager;
