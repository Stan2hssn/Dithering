/* common declarations */
precision highp float;

uniform sampler2D texture;
uniform sampler2D tVelocity;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform float uAspect;
uniform float uSize;
uniform float uOpacity;
uniform float uTime;

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}
float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
    uv -= disc_center;
    uv.x *= uAspect;
    float dist = sqrt(dot(uv, uv));
    return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
}
vec2 scuv(vec2 uv) {
    float zoom = 1.;
    return (uv - .5) * 1.2 * zoom + .5;
}
void main() {
    vec2 uv = gl_FragCoord.xy / vec2(128.0, 128.0).xy;
    vec2 cUV = uv;
    cUV += snoise(cUV * 2. + uTime * .1) * .04;
    vec4 texVel = texture2D(tVelocity, uv);
    cUV += texVel.yz * .05;
    vec4 tex = texture2D(texture, (uv));
    vec3 cursor = vec3(circle(cUV, uPointer, 0., .35 - uSize)) * uOpacity;
    cursor *= vec3(1., texVel.yz * .2);
    vec4 finalColor = vec4(cursor + tex.rgb * .975, uVelocity);
    gl_FragColor = finalColor;
}
