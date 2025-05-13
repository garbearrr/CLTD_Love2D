export const scanlines = `
extern number scanlineStrength = 0.4;
extern number edgeOffset      = 0.002;
extern number edgeWidth       = 0.05;

// how far (in pixels) to bleed
extern number bleedDistance   = 2;
// 0 = no bleed, 1 = full blur
extern number bleedStrength   = 0.6;

// the size of one texel in UV‐space: (1/width, 1/height)
extern vec2   texelSize = vec2(1.0/600.0, 1.0/600.0);

vec4 effect(vec4 color, Image tex, vec2 uv, vec2 px)
{
    // 1) chromatic aberration near vertical edges
    vec4 col;
    if (uv.x < edgeWidth || uv.x > 1.0 - edgeWidth) {
        col.r = Texel(tex, uv + vec2( edgeOffset, 0)).r;
        col.g = Texel(tex, uv           ).g;
        col.b = Texel(tex, uv - vec2( edgeOffset, 0)).b;
        col.a = 1.0;
    } else {
        col = Texel(tex, uv);
    }

    // 2) horizontal bleed: 5-tap box blur using texelSize.x
    vec4 sum = vec4(0.0);
    sum += Texel(tex, uv + vec2(-2.0 * bleedDistance * texelSize.x, 0.0));
    sum += Texel(tex, uv + vec2(-1.0 * bleedDistance * texelSize.x, 0.0));
    sum += col;
    sum += Texel(tex, uv + vec2( 1.0 * bleedDistance * texelSize.x, 0.0));
    sum += Texel(tex, uv + vec2( 2.0 * bleedDistance * texelSize.x, 0.0));
    sum /= 5.0;
    col = mix(col, sum, bleedStrength);

    // 3) scanline darkening
    if (mod(px.y, 2.0) < 1.0) {
        col.rgb *= 1.0 - scanlineStrength;
    }

    return col * color;
}
`;

export const warpFrag = `
extern vec2   resolution;    // Screen resolution (width, height)
extern vec2   curvature;     // How strong the barrel warp is (x, y)
extern float  blurAmount;    // overall strength of the blur (0 = off, 1 = full)
  
// Love2D will pass sc = (1/width, 1/height) so we can step exactly one texel
vec4 effect(vec4 color, sampler2D tex, vec2 tc, vec2 sc) {
    // 1) barrel-warp the UV
    vec2 uv = tc * 2.0 - 1.0;
    vec2 d  = uv * uv;
    uv += uv * d * curvature;
    uv  = uv * 0.5 + 0.5;

    // if outside, black
    if (uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0) return vec4(0);

    // 2) sample 3×3 neighborhood
    //    you can tune these weights or expand to a larger kernel
    vec4 sum = vec4(0.0);
    sum += Texel(tex, uv            ) * 0.36;         // center
    sum += Texel(tex, uv + sc * vec2( 1,  0)) * 0.16;  // right
    sum += Texel(tex, uv + sc * vec2(-1,  0)) * 0.16;  // left
    sum += Texel(tex, uv + sc * vec2( 0,  1)) * 0.16;  // up
    sum += Texel(tex, uv + sc * vec2( 0, -1)) * 0.16;  // down
    sum += Texel(tex, uv + sc * vec2( 1,  1)) * 0.04;  // diag
    sum += Texel(tex, uv + sc * vec2(-1,  1)) * 0.04;
    sum += Texel(tex, uv + sc * vec2( 1, -1)) * 0.04;
    sum += Texel(tex, uv + sc * vec2(-1, -1)) * 0.04;

    // 3) lerp between original and blurred by blurAmount
    vec4 col = mix( Texel(tex, uv), sum, blurAmount );

    return col * color;
}`;