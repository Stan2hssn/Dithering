uniform float uTime;

uniform vec2 uResolution;

uniform sampler2D tMap;
uniform sampler2D tImg;
uniform sampler2D tTex; 

#define BLACK vec3(0., 0., 0.)
#define BLUE vec3(0.2, 0.2, 1.)

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
    return color * dither4x4(position, luma_1(color));
}
vec4 dither4x4(vec2 position, vec4 color) {
    return vec4(color.rgb * dither4x4(position, luma_1(color)), 1.0);
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
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;

    vec3 trail = texture2D(tMap, uv).rgb;

    vec2 texUv = scaleUv(uv, vec2(1.), vec2(.5));
    vec4 tex = texture2D(tImg, texUv);
    float bwTex = luma_0(texture2D(tImg, texUv + trail.yz * .02).rgb);

    // Dithering

    vec2 dithUv = uv;
    dithUv.x *= aspect;
    vec4 dith = vec4(0.0);
    dith.rgb = vec3(0.3, 0.2, 1.) * clamp(0., 1., trail.x);
    dith = max(dither4x4(dithUv * 300. + trail.yz * 10., dith), .05);
    vec3 coloredDith = mix(BLACK, BLUE, dith.r);

    vec4 patternDith = vec4(0.0);
    vec3 pattern = vec3(fbm(vec3(uv, uTime * .1)));
    patternDith += max(dither4x4(dithUv * 300., vec4(pattern, 0.)), .01);
    vec3 bgColoredDith = mix(BLACK, BLUE, patternDith.r);
    vec3 edges = clamp(0., 1., fastEdgeDetection(tImg, texUv + trail.yz * .02)) * BLUE;
    vec3 finalC = mix(tex.rgb, coloredDith + edges, smoothstep(0.9, 2.5, trail.r));
    finalC += mix(vec3(0.), bgColoredDith, trail.r) * .1;

    gl_FragColor = vec4(coloredDith, 1.);
}