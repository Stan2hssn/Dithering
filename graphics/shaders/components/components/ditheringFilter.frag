precision highp float;

uniform float uColorNum;
uniform float uPixelSize;

uniform vec2 uResolution;
uniform vec2 uParisTexDimension;
uniform vec2 uMontrealTexDimension;

uniform vec3 uColor;
uniform vec3 uBgColor;

uniform sampler2D tParisTex;
uniform sampler2D tMontrealTex;
uniform sampler2D tMap;

const mat2x2 bayerMatrix2x2 = mat2x2(0.0, 2.0, 3.0, 1.0) / 4.0;

const mat4x4 bayerMatrix4x4 = mat4x4(0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0) / 16.0;

const float bayerMatrix8x8[64] = float[64](0.0 / 64.0, 48.0 / 64.0, 12.0 / 64.0, 60.0 / 64.0, 3.0 / 64.0, 51.0 / 64.0, 15.0 / 64.0, 63.0 / 64.0, 32.0 / 64.0, 16.0 / 64.0, 44.0 / 64.0, 28.0 / 64.0, 35.0 / 64.0, 19.0 / 64.0, 47.0 / 64.0, 31.0 / 64.0, 8.0 / 64.0, 56.0 / 64.0, 4.0 / 64.0, 52.0 / 64.0, 11.0 / 64.0, 59.0 / 64.0, 7.0 / 64.0, 55.0 / 64.0, 40.0 / 64.0, 24.0 / 64.0, 36.0 / 64.0, 20.0 / 64.0, 43.0 / 64.0, 27.0 / 64.0, 39.0 / 64.0, 23.0 / 64.0, 2.0 / 64.0, 50.0 / 64.0, 14.0 / 64.0, 62.0 / 64.0, 1.0 / 64.0, 49.0 / 64.0, 13.0 / 64.0, 61.0 / 64.0, 34.0 / 64.0, 18.0 / 64.0, 46.0 / 64.0, 30.0 / 64.0, 33.0 / 64.0, 17.0 / 64.0, 45.0 / 64.0, 29.0 / 64.0, 10.0 / 64.0, 58.0 / 64.0, 6.0 / 64.0, 54.0 / 64.0, 9.0 / 64.0, 57.0 / 64.0, 5.0 / 64.0, 53.0 / 64.0, 42.0 / 64.0, 26.0 / 64.0, 38.0 / 64.0, 22.0 / 64.0, 41.0 / 64.0, 25.0 / 64.0, 37.0 / 64.0, 21.0 / 64.0);

vec3 dither(vec2 uv, vec3 color) {
    int x = int(uv.x * uResolution.x) % 8;
    int y = int(uv.y * uResolution.y) % 8;
    float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;

    color.rgb += threshold;
    color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);

    return color;
}

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

float luma_0(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float luma_0(vec4 color) {
    return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float luma_1(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float luma_1(vec4 color) {
    return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float dither4x4(vec2 position, float brightness) {
    int x = int(mod(position.x, 4.0));
    int y = int(mod(position.y, 4.0));
    int index = x + y * 4;
    float limit = 0.0;
    if(x < 8) {
        if(index == 0)
            limit = 0.0625;
        if(index == 1)
            limit = 0.5625;
        if(index == 2)
            limit = 0.1875;
        if(index == 3)
            limit = 0.6875;
        if(index == 4)
            limit = 0.8125;
        if(index == 5)
            limit = 0.3125;
        if(index == 6)
            limit = 0.9375;
        if(index == 7)
            limit = 0.4375;
        if(index == 8)
            limit = 0.25;
        if(index == 9)
            limit = 0.75;
        if(index == 10)
            limit = 0.125;
        if(index == 11)
            limit = 0.625;
        if(index == 12)
            limit = 1.0;
        if(index == 13)
            limit = 0.5;
        if(index == 14)
            limit = 0.875;
        if(index == 15)
            limit = 0.375;
    }
    return brightness < limit ? 0.0 : 1.0;
}

vec3 dither4x4(vec2 position, vec3 color) {
    return color * dither4x4(position, luma_1(vec3(color.g)));
}

vec4 dither4x4(vec2 position, vec4 color) {
    return vec4(vec3(dither4x4(position, luma_1(color))), 1.0);
}

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

vec2 scaleUv(vec2 uv, vec2 scale, vec2 origin) {
    vec2 st = uv - origin;
    st /= scale;
    return st + origin;
}

float fastEdgeDetection(sampler2D tex, vec2 coords) {
    vec3 TL = texture2D(tex, coords + vec2(-1, 1) / uResolution.xy).rgb;
    vec3 TM = texture2D(tex, coords + vec2(0, 1) / uResolution.xy).rgb;
    vec3 TR = texture2D(tex, coords + vec2(1, 1) / uResolution.xy).rgb;
    vec3 ML = texture2D(tex, coords + vec2(-1, 0) / uResolution.xy).rgb;
    vec3 MR = texture2D(tex, coords + vec2(1, 0) / uResolution.xy).rgb;
    vec3 BL = texture2D(tex, coords + vec2(-1, -1) / uResolution.xy).rgb;
    vec3 BM = texture2D(tex, coords + vec2(0, -1) / uResolution.xy).rgb;
    vec3 BR = texture2D(tex, coords + vec2(1, -1) / uResolution.xy).rgb;
    vec3 GradX = -TL + TR - 2.0 * ML + 2.0 * MR - BL + BR;
    vec3 GradY = TL + 2.0 * TM + TR - BL - 2.0 * BM - BR;
    return length(vec2(GradX.r, GradY.r)) + length(vec2(GradX.g, GradY.g)) + length(vec2(GradX.b, GradY.b));
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;

    // Trail Texture
    vec3 trail = texture2D(tMap, uv).rgb;

    // Aspect Textures

    float ratio = uResolution.x / uResolution.y;

    float direction = step(uMontrealTexDimension.x / uMontrealTexDimension.y, ratio);

    vec2 responsive = vec2(mix(ratio, 1.0, direction), mix(1.0, 1.0 / ratio, direction));

    vec2 uvCover = coverTexUv(uMontrealTexDimension, uv, responsive);

    uv.x *= aspect;

    vec4 parisTexel = texture2D(tParisTex, scaleUv(uvCover, vec2(1., 1.)));
    vec4 montrealTexel = texture2D(tMontrealTex, uvCover);

    vec4 patternDith = vec4(0.0);
    vec3 pattern = vec3(parisTexel.r - trail.r * 1.3);
    patternDith = max(dither4x4((uv * 400.) - trail.r, vec4(pattern - trail.r * .1, 0.)), .0);

    gl_FragColor = vec4(trail, 1.);
    gl_FragColor = vec4(mix(uColor, uBgColor, patternDith.r), 1.);
}