import mitt from "mitt";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  TextureLoader,
  Object3D,
  VideoTexture,
  SRGBColorSpace,
  Vector2,
} from "three";

class Library {
  constructor(_assets) {
    this.emitter = mitt(); // Initialize mitt
    this.assets = _assets;
    this.items = {};
    this.lazyItems = {};

    this.current = 0;
    this.loadComplete = false;

    this.lazyCurrent = 0;
    this.lazzyTarget = {};
    this.resourcesLength;
    this.lazyLength = 0;

    // Loader
    this.setLoaders();
    this.lazyLoadAssets = this.lazyLoadAssets.bind(this);
  }

  dispose() {
    Object.keys(this.items).forEach((key) => {
      if (this.items[key].dispose) {
        this.items[key].dispose();
        if (typeof this.items[key] === "object") {
          this.items[key] = null;
        } else {
        }
      } else {
        this.unload(this.items[key]);
      }
    });

    this.items = {};
    this.emitter = null;

    this.assets = null;
    this.current = null;
    this.loadComplete = null;
    this.resourcesLength = null;
  }

  unload(target) {
    if (target instanceof Object3D) {
      target.removeFromParent();
      target.traverse((child) => {
        // disposing materials
        if (child.material && !child.material._isDisposed) {
          // disposing textures
          for (const [key, value] of Object.entries(child.material)) {
            if (!value) continue;
            if (typeof value.dispose === "function" && !value._isDisposed) {
              value.dispose();
              value._isDisposed = true;
              child[key] = null;
            }
          }
          child.material.dispose();
          child.material._isDisposed = true;
          child.material = null;
        }
        // disposing geometries
        if (child.geometry?.dispose && !child.geometry._isDisposed) {
          child.geometry.dispose();
          child.geometry._isDisposed = true;
          child.geometry = null;
        }

        // disposing skinned mesh
        if (
          child.skeleton?.boneTexture &&
          !child.skeleton?.boneTexture._isDisposed
        ) {
          child.skeleton.boneTexture.dispose();
          child.skeleton.boneTexture._isDisposed = true;
          child.skeleton.boneTexture = null;
        }

        requestAnimationFrame(() => (child.children = null));
      });
    }
  }

  loadAssets() {
    this.loadAssets(this.assets);
  }

  setLoaders() {
    this.loaders = [];

    // Images
    const textureLoader = new TextureLoader();

    this.loaders.push({
      extensions: ["png", "jpg", "jpeg", "webp", "svg", "avif"],
      action: (_resource, lazy = false) => {
        if (this.items.hasOwnProperty(_resource.name)) {
          this.lazyLoadEnd(_resource, this.items[_resource.name]);
          return;
        }

        if (_resource.type === "image") {
          this.fileLoadEnd(_resource, _resource.source);
        } else if (_resource.type === "texture") {
          textureLoader.load(
            _resource.source,
            (texture) => {
              const img = texture.image;
              const width = img?.naturalWidth || img?.width;
              const height = img?.naturalHeight || img?.height;

              texture.userData = {
                name: _resource.name,
                dimension: new Vector2(width, height),
              };

              if (lazy) {
                this.lazyLoadEnd(_resource, texture);
              } else {
                this.fileLoadEnd(_resource, texture);
              }
            },
            undefined,
            (err) => {
              console.error("Texture loading error:", err, _resource);
              this.fileLoadEnd(_resource, null); // Handle error gracefully
            },
          );
        }
      },
    });

    // Draco Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    dracoLoader.setDecoderConfig({ type: "js" });

    // GLTF
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    this.loaders.push({
      extensions: ["glb", "gltf"],
      action: (_resource) => {
        if (this.items.hasOwnProperty(_resource.name)) {
          this.lazyLoadEnd(_resource, this.items[_resource.name]);
          return;
        }

        gltfLoader.load(
          _resource.source,
          (data) => {
            this.fileLoadEnd(_resource, data);
          },
          undefined,
          (err) => {
            console.error("GLTF loading error:", err);
            this.fileLoadEnd(_resource, null);
          },
        );
      },
    });

    // Audio
    this.loaders.push({
      extensions: ["mp3", "wav"],
      action: (_resource) => {
        if (this.items.hasOwnProperty(_resource.name)) {
          this.lazyLoadEnd(_resource, this.items[_resource.name]);
          return;
        }

        this.fileLoadEnd(_resource, _resource.raw);
      },
    });

    // Videos
    this.loaders.push({
      extensions: ["mp4", "webm"],
      action: (_resource, lazy = false) => {
        if (this.items.hasOwnProperty(_resource.name)) {
          this.lazyLoadEnd(_resource, this.items[_resource.name]);
          return;
        }

        const video = this.lazzyTarget[_resource.name]
          ? this.lazzyTarget[_resource.name]
          : document.getElementById(_resource.name);

        video.muted = true;

        const output = new VideoTexture(video);
        output.colorSpace = SRGBColorSpace;
        if (lazy) {
          video.play();
          video.loop = true;
          this.lazyLoadEnd(_resource, output);
        } else {
          this.getVideoDimensions(video).then(({ width, height }) => {
            output.userData = {
              $video: video,
              height,
              width,
            };

            this.fileLoadEnd(_resource, output);
          });
        }
      },
    });
  }

  getVideoDimensions(videoElement) {
    return new Promise((resolve, reject) => {
      if (videoElement.readyState >= 1) {
        // If metadata is already loaded
        resolve({
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        });
      } else {
        videoElement.addEventListener("loadedmetadata", function onLoad() {
          videoElement.removeEventListener("loadedmetadata", onLoad);
          resolve({
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          });
        });
      }
    });
  }

  gatherAssets(obj, all = [], path = []) {
    if (obj && typeof obj === "object" && "source" in obj && "type" in obj) {
      all.push(obj);
      return all;
    }

    for (const key in obj) {
      if (typeof obj[key] === "object") {
        this.gatherAssets(obj[key], all, [...path, key]);
      }
    }

    return all;
  }

  gatherLazyAssets(obj, all = [], visited = new WeakSet()) {
    // If we've seen this object before, skip it
    if (obj && typeof obj === "object") {
      if (visited.has(obj)) {
        return all;
      }
      visited.add(obj);
    }

    // If it’s a resource object with `source` & `type`, record it
    if (obj && typeof obj === "object" && "source" in obj && "type" in obj) {
      all.push(obj);
    }
    // Else keep drilling down if it’s an object
    else if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          this.gatherLazyAssets(obj[key], all, visited);
        }
      }
    }

    return all;
  }

  loadAssets(_resources) {
    const flattenedAssets = this.gatherAssets(_resources);

    this.load(flattenedAssets);
  }

  lazyLoadAssets(_resource, length, $target) {
    this.lazyLength = length;
    this.lazyCurrent = 0;

    this.lazyItems[_resource.name] = _resource;
    this.lazzyTarget[_resource.name] = $target;

    if (Object.keys(this.lazyItems).length === this.lazyLength) {
      const flattenedAssets = this.gatherLazyAssets(this.lazyItems);
      this.lazyLoad(flattenedAssets);
    }
  }

  lazyLoad(_resources = []) {
    if (_resources.length === 0) {
      return;
    } else {
      for (const [i, _resource] of _resources.entries()) {
        this.lazyLength = _resources.length;

        const extensionMatch = _resource.source.match(/\.([a-z0-9]+)$/);

        if (extensionMatch) {
          const extension = extensionMatch[1];
          const loader = this.loaders.find((_loader) =>
            _loader.extensions.includes(extension),
          );

          if (loader) {
            loader.action(_resource, true);
          } else {
            console.warn(`Cannot find loader for resource:`, _resource);
          }
        } else {
          console.warn(`Cannot find extension for resource:`, _resource);
        }
      }
    }
  }

  load(_resources = []) {
    if (_resources.length === 0) {
      this.current = this.resourcesLength;
      this.loadComplete = true;

      this.emitter.emit("assetsLoaded");
      return;
    } else {
      for (const [i, _resource] of _resources.entries()) {
        this.resourcesLength = _resources.length;

        const extensionMatch = _resource.source.match(/\.([a-z0-9]+)$/);

        if (extensionMatch) {
          const extension = extensionMatch[1];
          const loader = this.loaders.find((_loader) =>
            _loader.extensions.includes(extension),
          );

          if (loader) {
            loader.action(_resource);
          } else {
            console.warn(`Cannot find loader for resource:`, _resource);
          }
        } else {
          console.warn(`Cannot find extension for resource:`, _resource);
        }
      }
    }
  }

  on(event, callback) {
    this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  fileLoadEnd(_resource, _data) {
    this.current++;
    this.items[_resource.name] = _data;

    if (this.current === this.resourcesLength) {
      this.loadComplete = true;

      this.emitter.emit("assetsLoaded");
    }
  }

  lazyLoadEnd(_resource, _data) {
    this.lazyCurrent++;
    this.items[_resource.name] = _data;

    if (this.lazyCurrent === this.lazyLength) {
      setTimeout(() => {
        this.emitter.emit("lazyLoaded");

        this.lazyLoadComplete = true;
        this.lazyItems = {};
        this.lazzyTarget = {};
        this.lazyCurrent = 0;
      }, 1000);
    }
  }
}

export default Library;
