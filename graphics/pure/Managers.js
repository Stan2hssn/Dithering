import SceneManager from "@/Managers/SceneManager.js";
import RendererManager from "@/Managers/RendererManager.js";
import CameraManager from "@/Managers/CameraManager.js";

const Managers = {
  RendererManager: ({ canvas }) => new RendererManager({ canvas }),
  SceneManager: (params) => new SceneManager(params),
  CameraManager: (params) => new CameraManager(params),
};

export default Managers;
