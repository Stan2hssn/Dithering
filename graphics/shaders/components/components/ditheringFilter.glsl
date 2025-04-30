uniform float uTime;         // time in seconds
uniform float uTimeDelta;    // time delta in seconds
uniform float uPixelSize;     // e.g. 8.0 or 10.0 – size of one block in **screen** pixels
uniform float uColorNum;      // number of brightness levels you want to keep
uniform float uTransition;      // transition speed of the dithering effect

uniform vec2 uResolution;    // framebuffer size
uniform vec2 uParisTexDimension;
uniform vec2 uMontrealTexDimension;

uniform vec3 uColor;         // “ink”   colour
uniform vec3 uBgColor;       // “paper” colour

uniform sampler2D tParisTex;   // source image
uniform sampler2D tMontrealTex;
uniform sampler2D tMap;

varying vec2 vUv;

// ---------------------------------------------------------------------------
// 8×8 Bayer (already normalised 0-1)
const float bayer8x8[64] = float[64](0. / 64., 48. / 64., 12. / 64., 60. / 64., 3. / 64., 51. / 64., 15. / 64., 63. / 64., 32. / 64., 16. / 64., 44. / 64., 28. / 64., 35. / 64., 19. / 64., 47. / 64., 31. / 64., 8. / 64., 56. / 64., 4. / 64., 52. / 64., 11. / 64., 59. / 64., 7. / 64., 55. / 64., 40. / 64., 24. / 64., 36. / 64., 20. / 64., 43. / 64., 27. / 64., 39. / 64., 23. / 64., 2. / 64., 50. / 64., 14. / 64., 62. / 64., 1. / 64., 49. / 64., 13. / 64., 61. / 64., 34. / 64., 18. / 64., 46. / 64., 30. / 64., 33. / 64., 17. / 64., 45. / 64., 29. / 64., 10. / 64., 58. / 64., 6. / 64., 54. / 64., 9. / 64., 57. / 64., 5. / 64., 53. / 64., 42. / 64., 26. / 64., 38. / 64., 22. / 64., 41. / 64., 25. / 64., 37. / 64., 21. / 64.);

// Returns 0 or 1, never grey.
float orderedDither8x8(vec2 fragCoord, float luminance) {
    // integer coordinates of the **screen-space** pixel
    ivec2 pix = ivec2(fragCoord);

    // Bayer index (mod 8)
    int bx = pix.x & 7;
    int by = pix.y & 7;
    float thresh = bayer8x8[by * 8 + bx];

    // quantise input luminance to uColorNum levels **before** comparison
    float qLum = floor(luminance * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);

    return step(thresh, qLum);   // 0 or 1
}

// Cover texture UVs

vec2 scaleUv(vec2 uv, vec2 scale) {
    vec2 scaledUv = uv -= 0.5;
    scaledUv *= scale;
    scaledUv += 0.5;
    return scaledUv;
}

vec2 coverTexUv(vec2 imgSize, vec2 ouv, vec2 res) {
    vec2 s = res;
    vec2 i = imgSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    return ouv * s / new + offset;
}

// FBM function
float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);
    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);
    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);
    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));
    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for(int i = 0; i < 5; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// -----------------------------------------------------------

void main() {
    // -----------------------------------------------------------
    // 1. snap the fragment to the centre of a logical “pixel” block
    vec2 frag = gl_FragCoord.xy;
    vec2 cellOrigin = floor(frag / uPixelSize) * uPixelSize + uPixelSize * 0.5;

    // 2. sample the texture **once** per block
    vec2 uv = cellOrigin / uResolution;          // normalised 0-1
    float aspect = uResolution.x / uResolution.y;

    // Aspect Textures
    float ratio = uResolution.x / uResolution.y;

    float direction = step(uMontrealTexDimension.x / uMontrealTexDimension.y, ratio);

    vec2 responsive = vec2(mix(ratio, 1.0, direction), mix(1.0, 1.0 / ratio, direction));

    vec2 uvCover = coverTexUv(uParisTexDimension, vUv, responsive);

    vec3 trail = texture2D(tMap, uv).rgb;
    // uv.x *= aspect;

    // Add noise
    vec2 noiseUv = uv - vec2(uTime * .1, 0.);
    vec2 noise = vec2(fbm(vec3(noiseUv * 10., 0.0)));
    vec3 noiseColor = vec3(0.) + fbm(vec3(uv * vec2(.1, 2.) + uTime * .05 + vec2(2.0), 0.0));
    float transition = fbm(vec3(uv, 0.0)) * sin(uTransition * 3.14);

    uvCover -= vec2(uTransition, 0.);

    vec2 shiftedUv = uvCover + vec2(uTransition, 0.0) * (transition * 12.);

    vec3 tex1 = texture2D(tParisTex, shiftedUv - vec2(uTransition, 0.) + noise * .003 - .01).rgb;
    vec3 tex2 = texture2D(tMontrealTex, shiftedUv + vec2(1.0, 0.0) + noise * .003 - .01).rgb;
    float blend = smoothstep(-0.2, 0.2, shiftedUv.x - uTransition);

    // Blend tex2 in as tex1 slides away
    vec3 tex = mix(tex2, tex1, blend);

    // 3. brightness we will dither (monochrome)
    float lum = dot(1. - tex, vec3(0.299, 0.587, 0.114));

    // 4. ordered dither -> 0 or 1
    float mask = orderedDither8x8(cellOrigin, min(lum + trail.r, 0.95));

    // 5. final colour = choose between two flat colours
    vec3 finalColour = mix(uBgColor, uColor, mask);

    gl_FragColor = vec4(vec3(noise, 1.), 1.);
    gl_FragColor = vec4(vec3(transition), 1.);
    gl_FragColor = vec4(finalColour, 1.0);
}
