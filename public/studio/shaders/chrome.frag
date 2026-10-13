
// === CONSTANTS ===
const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// === PCG hash ===
uvec3 hash3(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    return v;
}

vec3 seedRandom(float seedVal) {
    uvec3 s = uvec3(
        floatBitsToUint(seedVal),
        floatBitsToUint(seedVal * 1.5 + 7.31),
        floatBitsToUint(seedVal * 2.7 + 13.37)
    );
    s = hash3(s);
    return vec3(s) / float(0xFFFFFFFFu);
}

// === COLOR SPACE (Oklab/LCH) ===

vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    l = pow(max(l, 0.0), 1.0 / 3.0);
    m = pow(max(m, 0.0), 1.0 / 3.0);
    s = pow(max(s, 0.0), 1.0 / 3.0);

    return vec3(
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    );
}

vec3 oklabToLinear(vec3 c) {
    float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    l = l * l * l;
    m = m * m * m;
    s = s * s * s;

    return vec3(
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0);
    vec3 lch1 = oklabToLch(lab1);

    if (lch0.y < 0.05) lch0.z = lch1.z;
    if (lch1.y < 0.05) lch1.z = lch0.z;

    float dh = lch1.z - lch0.z;
    if (dh > 3.14159265) dh -= 6.28318530;
    if (dh < -3.14159265) dh += 6.28318530;

    return lchToOklab(vec3(
        mix(lch0.x, lch1.x, t),
        mix(lch0.y, lch1.y, t),
        lch0.z + dh * t
    ));
}

// === PALETTE ===

vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
    if (count < 1) return vec3(0.0);
    if (count < 2) return toLinear(getColor(0));

    float segmentSize = 1.0 / float(count - 1);
    t = clamp(t, 0.0, 1.0);
    int idx = min(int(floor(t / segmentSize)), count - 2);
    float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);

    vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
    vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));

    return oklabToLinear(mixLch(lab0, lab1, localT));
}

// === POST-PROCESS ===

vec3 softGamutMap(vec3 linearRgb) {
    float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
    float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));

    if (minC >= 0.0 && maxC <= 1.0) return linearRgb;

    vec3 lab = linearToOklab(max(linearRgb, 0.0));
    float L = clamp(lab.x, 0.0, 1.0);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);

    float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));

    if (C > maxChroma * 0.7) {
        float knee = maxChroma * 0.7;
        C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
    }

    return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

// === HEIGHTMAP HELPERS ===

float blurDepth3x3(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float radius) {
    vec2 r = radius * texel;

    float sum = 4.0 * textureGrad(u_image_heightmap, uv, dudx, dudy).r;

    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0, -r.y), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0,  r.y), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(-r.x, 0.0), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2( r.x, 0.0), dudx, dudy).r;

    sum += textureGrad(u_image_heightmap, uv + vec2(-r.x, -r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2( r.x, -r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2(-r.x,  r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2( r.x,  r.y), dudx, dudy).r;

    return sum / 16.0;
}

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float blurRadius) {
    float eps = 4.0;
    float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
    float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
    float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
    float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
    return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

// === MAIN ===

void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 texSize = vec2(textureSize(u_image_heightmap, 0));
    float imgAspect = texSize.x / texSize.y;
    float canvasAspect = u_resolution.x / u_resolution.y;

    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }

    /*
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
        return;
    }
    */

    // 1.0 on DPR 2+, up to 2.0 on DPR 1
    float aaScale = max(1.0, 2.0 / u_pixelRatio);

    vec2 dudx = dFdx(uv);
    vec2 dudy = dFdy(uv);

    vec4 hm = textureGrad(u_image_heightmap, uv, dudx, dudy);
    float fw_b = 0.5 * fwidth(hm.b);
    float hardMask = smoothstep(0.5 - fw_b, 0.5 + fw_b, hm.b);
    float opacity = hardMask * (1.0 - hm.g);

    // Only fade at the letterbox boundary, not on the axis the image fills
    float edgeDist;
    if (canvasAspect > imgAspect) {
        // Letterbox bars are left/right → only fade X edges
        edgeDist = min(uv.x, 1.0 - uv.x);
    } else if (canvasAspect < imgAspect) {
        // Letterbox bars are top/bottom → only fade Y edges
        edgeDist = min(uv.y, 1.0 - uv.y);
    } else {
        // Aspects match — no letterboxing, no seam, no fade needed
        edgeDist = 1.0;
    }
    opacity *= smoothstep(0.0, 1.0 * fwidth(edgeDist), edgeDist);

    if (opacity < 0.001) {
        fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
        return;
    }

    vec2 texel = 1.0 / texSize;
    int colorCount = u_colors_length;

    if (colorCount < 1) {
        fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
        return;
    }

    float rawDepth = blurDepth3x3(uv, dudx, dudy, texel, 6.0);
    float depth = max(rawDepth, 0.001);

    vec2 grad = heightGrad(uv, dudx, dudy, texel, 6.0);
    float gradMag = min(length(grad), 5.0);
    vec2 gradDir = gradMag > 0.001 ? normalize(grad) : vec2(0.0);
    vec2 contourDir = vec2(-gradDir.y, gradDir.x);

    float t = mod(u_time * u_speed, 3600.0);

    // Motion mode: 0 = Random, 1 = Melt
    float isMelt = step(0.5, u_motionMode);

    // Seed
    vec3 seedOffset = seedRandom(u_seed);
    vec3 seedOffset2 = seedRandom(u_seed + 100.0);
    float seedAngle = u_seed * GOLDEN_ANGLE;
    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

    // World-space coordinates anchored to the image
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= imgAspect;

    // Seed-based rotation
    float cs = cos(seedAngle);
    float sn = sin(seedAngle);
    p = mat2(cs, -sn, sn, cs) * p;

    // Angle — rotates the gradient flow direction
    float ang = u_angle * 3.14159 / 180.0;
    float cosA = cos(ang);
    float sinA = sin(ang);
    p = vec2(p.x * cosA - p.y * sinA, p.x * sinA + p.y * cosA);

    // === MOUSE PUSH (fluid, from push buffer) ===
    vec2 pf = texture(u_push_buffer, v_uv).xy;

    // Buffer space is v_uv (Y-up); image uv is flipped → flip the vector's Y
    // BEFORE any rotation, or the rotations scramble the error across axes.
    pf.y = -pf.y;

    // Buffer aspect-corrects with canvas aspect; p is in image-aspect space.
    // On the tall-canvas branch the letterbox remap doesn't cancel it out.
    if (canvasAspect <= imgAspect) {
        pf *= imgAspect / canvasAspect;
    }

    pf = mat2(cs, -sn, sn, cs) * pf;                                  // seed rotation
    pf = vec2(pf.x * cosA - pf.y * sinA, pf.x * sinA + pf.y * cosA);  // angle rotation
    p -= pf * 2.0;


    // Turbulence time
    float tTurb = t * mix(1.0, 0.4, isMelt);

    // Melt flow offset applied to q inside turbulence, not to p
    vec2 meltOffset = vec2(1.0, 0.0) * t * 0.4 * isMelt;

    // === SHAPE-AWARE COORDINATE WARPING ===
    float edgeProximity = 1.0 - smoothstep(0.0, 0.8, depth);

    float coordScale = max(0.4, 0.1 + depth * 1.0);
    p *= coordScale;

    p += contourDir * edgeProximity * u_bend * 2.0;
    p -= gradDir * edgeProximity * u_bend * 0.5;
    p *= max(0.5, mix(1.0, 0.4 + 0.6 * smoothstep(0.0, 0.5, depth), u_contour));

    // === TURBULENCE ===
    int turbIter = int(u_turbIter);
    float freq = 1.0 / max(u_turbFreq, 0.01);

    vec2 q = p * u_scale + meltOffset;

    float a = seedPhase.x;
    float d = seedPhase.y;

    for (int j = 2; j < 10; j++) {
        if (j >= turbIter) break;
        float fj = float(j);
        q += u_turbAmp * sin(length(q) / freq * fj + tTurb + vec2(a, d) + seedOffset.xy * fj) / fj;
        a += cos(fj + d * 1.2 + q.x * 2.0 - tTurb + seedOffset2.z);
        d += sin(fj * q.y + a + seedOffset.z + tTurb + seedOffset2.y);
    }

    float base = length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + seedOffset.x;
    float val = 0.5 + 0.125 * sin(base + 1.0) + 0.25 * sin(base + 4.0) + 0.125 * sin(base + 9.0);
    val = clamp((val - 0.3) / 0.4, 0.0, 1.0);

    // Depth-based intensity modulation
    float innerIntensity = smoothstep(0.0, 0.4, depth);
    float contourHeat = (1.0 - innerIntensity) * u_contour;
    val = mix(val, val * innerIntensity + contourHeat, 0.5 + 0.5 * u_contour);

    vec3 col = paletteN(val, colorCount);
    col = softGamutMap(col);
    col = toSrgb(col);

    /*
    // Silhouette AA — hardMask + clamped fwidth
    float fw = fwidth(depth);
    float effectMask = hardMask * smoothstep(0.0, max(fw, min(2.0 * fw, 0.1)), depth);
    opacity *= effectMask;
    */

    // Alpha compositing
    col *= opacity;
    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    col = col + bgColor * (1.0 - opacity);
    float finalAlpha = opacity + u_colorBack.a * (1.0 - opacity);

    fragColor = vec4(col, finalAlpha);
}
