float horizon(in vec2 uv) {
    return uv.y * 0.5 + 0.5;
}

float sun(in vec2 uv) {
    return length(vec2(
        sin(.5 * (uv.x + iTime * 0.1))/0.5 - 1.0,
        uv.y - sin(iTime * 0.1) * 0.7 + 0.2
    ));
}

vec3 color_sky(in vec2 uv) {
    float the_sun = sun(uv);
    float light = ((horizon(uv) - 0.4) / (the_sun*the_sun + 1.0)) / 0.5;
    return vec3(max(light, 1.0 - float(the_sun > 0.1)));
}

void mainImage(out vec4 out_color, in vec2 f) {
    vec2 uv = f/iResolution.xy*2.0-1.0;
    uv.x*=iResolution.x/iResolution.y;

    vec3 color = vec3(0.0);
    color = color_sky(uv);
    color = uv.y > -0.2 ? color : vec3(0.0);
    out_color = vec4(color, 1.0);
}
