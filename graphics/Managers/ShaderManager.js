import viewVertexShader from "@/shaders/composers/view/vertex.glsl";
import viewFragmentShader from "@/shaders/composers/view/fragment.glsl";

import defaultVertexShader from "@/shaders/components/default/vertex.glsl";
import defaultFragmentShader from "@/shaders/components/default/fragment.glsl";

import trailShader from "@/shaders/components/preComponents/trail.glsl";

import backgroundPatternShader from "@/shaders/components/components/backgroundPattern.frag";
import ditheringFilterShader from "@/shaders/components/components/ditheringFilter.glsl";

const Shaders = {
  composers: {
    view: {
      vertex: viewVertexShader,
      fragment: viewFragmentShader,
    },
  },
  components: {
    default: {
      vert: defaultVertexShader,
      frag: defaultFragmentShader,
    },
    backgroundPattern: {
      frag: backgroundPatternShader,
    },
    ditheringFilter: {
      frag: ditheringFilterShader,
    },
  },
  preComponents: {
    trail: {
      combine: trailShader,
    },
  },
};

class ShadersManager {
  static get(category, name, type) {
    return Shaders[category][name][type];
  }
}

export default ShadersManager;
